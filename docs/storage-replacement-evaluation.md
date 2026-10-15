# Evaluation: replacing PostgreSQL/Redis with redb + rkyv

Status: evaluation only. No production code changed.

## Current state (measured)

- Ports: `ems-storage` holds about 121 `Send + Sync` port traits and no driver
  dependency. Adapters live in `ems-postgres` (about 21k lines, 71 tables, 32+
  migrations) and `ems-redis` (about 3k lines).
- Composition root: only `ems-runtime` depends on both adapters. DIP and IoC are
  therefore mostly in place. The work is finishing them, not starting them.
- Postgres features the SQL relies on: 108 `FOR UPDATE`, 27 `SKIP LOCKED`,
  188 `JOIN`, 6 `WITH RECURSIVE`, 58 `jsonb`, 54 indexes, 26 `ON CONFLICT`,
  2 advisory locks, 2 `NOTIFY`, `ILIKE`, offset paging.
- Redis features: Lua scripts (rate limit, throttle, lease), `ZADD`, `INCR`, TTL keys.
- Deployment: `EMS_DEPLOY_MODE` allows `management`, `frontend_hub`, `backend_hub`, `all_in_one`; `backend_hub` runs as a separate process.

## Verdict

| Part | Replace? | Reason |
| --- | --- | --- |
| Redis -> redb(+rkyv) | Feasible, low risk | Ephemeral KV with TTL; fits an embedded store. |
| PostgreSQL -> redb(+rkyv) | Not recommended now | Relational workload; high cost and risk. |

### Hard constraints

1. redb takes an exclusive file lock: one process per database file. Split roles
   (`backend` + `relay`) cannot share it. Redis replacement needs either `full`
   only, or a small local IPC owner for the ephemeral state.
2. redb is a sorted KV store with one writer at a time. There is no SQL, joins,
   secondary indexes, `SKIP LOCKED` or `NOTIFY`. Every join, index, recursive
   query, unique constraint and queue-claim becomes hand-written key design,
   with consistency maintained by us. The 71 tables and about 21k adapter lines
   would be a rewrite, not a swap.
3. Cross-process queue claiming (outbox, task leases) relies on `SKIP LOCKED`.
   With a single writer it becomes simpler in one process but impossible across
   processes.
4. rkyv gives zero-copy, fast reads but no schema evolution by default. Every
   stored type needs an explicit version tag plus migration code, and
   `bytecheck` validation on untrusted bytes. It suits caches and sessions,
   not long-lived business records, where serde-based formats evolve more safely.
5. Backup, replication, point-in-time recovery and ad-hoc admin queries
   are lost with Postgres. Acceptable for a cache, a real regression for the
   ledger and points data, which the contracts call authoritative durable storage.
6. `AGENTS.md` states Postgres is authoritative and Redis is replaceable. That
   contract and the Docker/Compose wiring must be amended first.

## Recommended path (phased, each phase independently shippable)

1. Finish the seams (no behavior change)
   - Make `ems-runtime` the only place that names a concrete adapter. Hide the
     two direct `sqlx` uses in `telegram_notification.rs` behind a port.
   - Add a `StorageBundle` composition trait/builder that returns the port
     bundle; select the backend by config (`EMS_STORAGE_BACKEND`).
   - Run one shared contract-test suite against every adapter, using the existing
     in-memory fakes in `ems-test-support` as the third implementation.
2. AOP via decorators, not macros
   - Wrap ports with generic decorators: `Traced<P>`, `Timed<P>`,
     `Retrying<P>`, `Audited<P>`, `Bounded<P>` (timeouts/concurrency).
   - Apply them once in the composition root. Adapters stay free of
     cross-cutting code, and a backend swap keeps all of it.
   - Reserve proc-macros for boilerplate delegation only (the 121 traits).
3. New `ems-redb` crate for the ephemeral ports (session, throttle, rate limit,
   tickets, passkey challenges, caches, coalescing). Values are rkyv archives
   with a version byte; a TTL table plus a sweeper task handles expiry.
   Use `spawn_blocking` for redb calls and never hold a transaction across await.
4. Decide on PostgreSQL after phase 3 using measured data: only if the product
   accepts single-process deployment and gives up SQL tooling. If so, migrate one
   bounded context at a time (start with append-only or lookup tables), never all
   71 tables at once.

## Open decisions for the owner

- Is single-process (`full` only) deployment acceptable for the Redis replacement?
- Is losing Postgres backup/PITR and SQL admin access acceptable for ledger data?
- Should redb sit behind the same `ems-storage` ports (recommended) or get new ports?

## Estimated scope

- Phase 1: small to medium, mostly mechanical, low risk.
- Phase 2: small.
- Phase 3: medium (about 10 ports, about 1.5k lines plus contract tests).
- Phase 4: very large, multi-month, high risk. Not recommended by default.

## Owner decisions (supersede the verdict table above)

- PostgreSQL will also be replaced, with risk reduced by testing.
- No auxiliary programs: the product stays one binary, no sidecar, no IPC owner,
  no external database service. Storage is embedded redb inside the backend process.
- Consequence: exactly one process owns the redb file. The `relay` role does not
  open the database (it only verifies signed grants), so it is unaffected. Any
  future role that needs data must call the owning backend over its existing API.
- Postgres and Redis stay available as adapters behind the same ports until the
  redb adapters pass every gate below; removal is a separate, final change.

## Risk mitigation plan

1. Shared contract suite: one generic test module per port, instantiated for the
   in-memory fake, Postgres and redb. A port is "done" only when all three pass.
   Cover uniqueness, optimistic versions, FIFO/claim ordering, lease expiry, TTL.
2. Differential and property tests: random operation sequences replayed against
   Postgres and redb must produce identical observable results (proptest).
3. Concurrency tests: many tasks racing claims, leases, ledger posts and rate
   limits; assert no double claim and no lost update. redb's single writer
   serializes writes, so tests also assert bounded write latency.
4. Crash safety: kill-at-random-point tests (child process abort mid-transaction),
   then reopen and verify invariants such as ledger balance equals sum of entries.
5. Data model rules for rkyv: every record carries a version tag; golden-bytes
   fixtures per version fail the build if the layout changes without a migration;
   all reads go through validated access (bytecheck), never unchecked.
6. Secondary indexes owned by one `Table` abstraction that updates index and row
   in the same write transaction; a consistency checker verifies every index
   against its rows and runs in tests and as an `ems` subcommand.
7. Backup: online backup is a consistent redb snapshot copy made by the backend
   itself (an `ems` subcommand), with no external tool.

## Revised phases

Not live yet, so there is no data to migrate: no import tool, no shadow mode, no
dual-write. Each port's CRUD is re-implemented on redb from the existing Postgres
adapter's behavior. Postgres/Redis adapters stay only as test oracles for the
differential tests, then are deleted in one change.

1. Seams, `StorageBundle`, decorators, contract suite harness (fake + Postgres).
2. `ems-redb` core: `Table`/index abstraction, rkyv codec, versioning, TTL, checker.
3. Ephemeral ports on redb (replaces Redis).
4. Durable ports by bounded context, ordered by risk: lookups and settings,
   identity/sessions, requests/subscriptions, outbox/leases, then ledger/points.
5. Delete `ems-postgres`, `ems-redis`, the SQL migrations and the Postgres/Redis
   services in `compose.yaml`; drop `EMS_DB_URL` and `EMS_REDIS_URL`; add a data
   directory volume for the redb file.

Because nothing is live, the schema can change freely now. The golden-bytes
fixtures start at the first release; before then a layout change only needs the
fixture regenerated.

Scale note: data volume is small, so redb's single writer is not a throughput
concern, and the rewrite can favor simple key design over heavy indexing.

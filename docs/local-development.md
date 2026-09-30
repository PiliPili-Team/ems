# Local full-stack development

## Repository ownership

Implement source in sibling repositories `../ems-backend` and `../ems-frontend`.
The integration repository owns pinned child commits, release manifests, Compose,
OpenAPI snapshots, and cross-repository documentation. Independent submodule worktrees
do not automatically receive changes made in the siblings.

## Local ports

| Surface | Address |
| --- | --- |
| Frontend Vite | `http://127.0.0.1:23333` |
| Management API | `http://127.0.0.1:23334/api/v1` |
| Protected Swagger | `http://127.0.0.1:23335/api/v1/swagger` |
| Playback gateway | `http://127.0.0.1:24333` |

The playback gateway must not use Vite's port. Vite proxies `/api` to the management
API. The documentation listener serves only documentation paths; other paths return
404. Swagger is inspect-only and uses local embedded assets, not a CDN.

## Backend

Start PostgreSQL and Redis, create a dedicated development database, and provide
runtime values through your shell or the IDE's private environment configuration.
Never commit real secrets or paste them into shared run configurations.

```bash
export EMS_RUN_ROLE=full
export EMS_DB_URL=postgres://localhost/ems
export EMS_REDIS_URL=redis://localhost/0
export EMS_API_LISTEN=127.0.0.1:23334
export EMS_API_ORIGIN=http://127.0.0.1:23334
export EMS_GATEWAY_LISTEN=127.0.0.1:24333
export EMS_SWAGGER_LISTEN=127.0.0.1:23335
export EMS_BOOTSTRAP_CORS_ORIGINS=http://127.0.0.1:23333
# Set EMS_MASTER_KEY, EMS_BOOTSTRAP_TOKEN, EMS_ENCIPHER_KEY, and EMS_ENCIPHER_IV
# using private deployment-generated values before starting the process.
cargo run --bin ems -- run
```

Run this command from `../ems-backend`. The master key is 32 bytes encoded as hex.
Playback encipher key and IV are text values accepted by the existing normalization;
each must contain at least six bytes. The bootstrap proof must satisfy the backend's
32–4096-byte constraint. Keep existing deployment keys stable; replacing the master
key is not a supported recovery procedure.

An empty deployment does not create an administrator during startup. Open the
frontend and submit the operator proof in the public initialization form. The proof
travels in `X-EMS-Bootstrap-Token`; the server generates the API key. Save its one-time
display before continuing to login. Later media/line configuration steps do not
reopen administrator creation. Explicit account recovery commands remain separate.

## Frontend and WebStorm

From `../ems-frontend`, install locked dependencies with Yarn1's
`yarn install --frozen-lockfile` and run `yarn dev`. Configure WebStorm's package manager as Yarn; use the retained
`EMS Frontend Dev` run configuration. `EMS_API_URL` defaults to the local API origin.

Open the backend project with the Rust plugin and use `EMS Backend Cargo Run`.
Supply the private environment values above through your local IDE environment.
The tracked run configuration contains endpoints only, not usable secret defaults.
Use Rust breakpoints for API/service code and a JavaScript browser debug session
pointing at port 23333 for frontend breakpoints. IDE breakpoint attachment itself
has not been exercised by the automated browser smoke.

Swagger requires an admitted administrator or super-administrator session cookie.
Anonymous clients receive 401; ordinary, VIP, and whitelist users receive 403.
Disabled users and stale authorization revisions do not gain access to assets or
schemas. Browser cookies apply across local ports for the same host; use
`127.0.0.1` consistently rather than mixing it with `localhost`.

## Focused verification

```bash
# From the frontend sibling

yarn typecheck
yarn vitest run src/auth/__tests__/bootstrap.spec.ts src/pages/__tests__/initialize.spec.ts src/utils/__tests__/initialization.spec.ts
yarn build

# From the backend sibling, using isolated real-service test fixtures

EMS_TEST_POSTGRES_URL=postgres://localhost/postgres EMS_TEST_REDIS_URL=redis://localhost/15 cargo test -p ems-runtime --test bootstrap_contract --test swagger_contract -- --ignored
cargo test -p ems-api --test openapi_contract
```

Observed smoke evidence includes real CLI startup, operator-proof administrator
creation, one-time key display, mobile login at the media setup step, protected
Swagger rendering, document byte parity, and graceful SIGINT shutdown. These checks
do not replace full frontend tests, inherited-page acceptance, stream-mode gates,
Docker health checks, or final pinned-release validation.

## Compose

Compose builds the exact local submodule worktrees; it does not fetch a branch.
Provide `POSTGRES_PASSWORD`, `EMS_DB_URL` (host `postgres`), `EMS_REDIS_URL`
(host `redis`), `EMS_MASTER_KEY`, `EMS_BOOTSTRAP_TOKEN`, `EMS_ENCIPHER_KEY`
and `EMS_ENCIPHER_IV` through private runtime environment values. The key constraints
above also apply to containers. No usable secret defaults are included.

Use Docker Compose with BuildKit/buildx support for the named integration build
context, which supplies the versioned Nginx configuration without copying either
source tree. Run `docker compose config --quiet`, then `docker compose up --build
--wait`. The frontend waits for the backend's public version endpoint; the backend
waits for PostgreSQL and Redis health checks and starts with the explicit `run`
command. Protected diagnostics are not used as anonymous health endpoints.
The backend build uses `cargo --locked`: it may download pinned crates during a
clean build without changing the lockfile. `--frozen` also forces offline mode and
cannot populate an empty build image. Dockerfile-specific ignore files exclude local
targets, dependencies, logs and private environment files from build contexts.
Build and runtime Debian versions must match their libc baseline; the backend runs
as the unprivileged `ems` user from its writable home directory.
If the official Debian host is unreachable, `DEBIAN_MIRROR` is an explicit backend
build argument for a trusted mirror serving both Debian and Debian security paths.
TLS certificate verification and Debian archive signature verification remain enabled;
never disable either to work around a local proxy. The copied builder CA bundle is
passed explicitly to apt before the runtime certificate package is installed.

On macOS, an isolated Colima profile can avoid changing the default Docker context:
`colima start --profile ems-integration --activate=false`. Point `DOCKER_HOST` at
that profile's reported socket for each Compose invocation; do not add a login
service for an acceptance-only runtime. Container acceptance remains separate from
native service smoke and requires observing healthy services and browser/API flows.

Observed candidate smoke used backend `04b52340848fd6e6d0e40fdb3522aac4fba2b00f`
and frontend `bef3fa08e301e8e30130eeb05ff9784c2d921ebc` in four healthy
containers with a fresh isolated database: browser bootstrap201, password cookie
login200, verified super-admin profile200, logout204 and revoked profile401;
reloading the protected route returned to login without the admin menu. These are
candidate source commits, not updated release pins. Provider discovery404, absent RP
capability/passkey503 and inherited dashboard contracts remain release blockers.
Clear the disposable smoke origin's old PWA cache when switching source candidates
before attributing browser output to the new image.

# EMS Integration Repository

This repository pins `ems-backend` and `ems-frontend` as submodules and owns combined
Docker, Compose, API contract, integration-test, and release orchestration.

## Submodules

```bash
git submodule update --init --recursive
```

## Default ports

```text
Web: 23333
API: 23334
Swagger: 23335
```

## HTTPS in production

Serve the web app and API over HTTPS with HSTS (`Strict-Transport-Security`) in every
production deployment, and set the public domain to its `https://` origin; the backend logs a
warning at start-up when it is not.

EMS account passwords are sealed in the browser to a one-time X25519 key from
`POST /auth/transport-key` (AES-256-GCM, 120-second keys, one use each). This keeps passwords
out of passive captures and proxy or access logs, even on plain-HTTP LAN access. It does not
stop an attacker who can change traffic, since they can replace the page script or the key.
Only HTTPS stops that, so sealing is an extra layer, not a replacement. Media server (Emby)
passwords are not sealed yet.

## Stream modes

- `frontend`: client-facing stream frontend forwarding to a backend.
- `backend`: stream backend serving client requests.
- `dual`: both roles on one machine with distinct listeners.

## EMS feature and role contracts

The replacement frontend is gated by the integration-owned inventory and role matrix:

- [`docs/ems-feature-inventory.md`](docs/ems-feature-inventory.md) — page families,
  feature permissions, API families, and acceptance gate.
- [`docs/ems-role-matrix.md`](docs/ems-role-matrix.md) — independent role/tier
  visibility and editability rules.
- [`docs/roles/`](docs/roles/) — ordinary, VIP, whitelist, administrator, and super
  administrator references.

These documents describe contracts only. Frontend guards are not authorization; the
backend remains authoritative for every protected request.

## Child repository commands

```bash
cd submodules/backend && scripts/ems-build.sh
cd submodules/frontend && pnpm build
```

The integration repository pins both child commits. Run child checks before updating
the submodule pointers, then run Compose/API/E2E checks from this repository.

Source ownership remains in the two child repositories. This repository must not copy
or duplicate their source trees.

## Local submodule development

The integration repository keeps remote submodule URLs for reproducible CI and release
builds. Developers may create the ignored local helper below to pin the current clean,
committed local child repositories without pushing them first:

```bash
scripts/local-sync-submodules.sh --dry-run
scripts/local-sync-submodules.sh
```

The helper is intentionally ignored by Git and never runs `git push`. It refuses dirty
source or target worktrees. CI and other developers continue using the committed remote
submodule URLs and pinned commits.

## Local development

See [local full-stack development](docs/local-development.md) for sibling source
ownership, private runtime configuration, ports 23333/23334/23335, WebStorm launch
settings, operator-proof bootstrap, protected Swagger, and verification limits.

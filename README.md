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

## Stream modes

- `frontend`: client-facing stream frontend forwarding to a backend.
- `backend`: stream backend serving client requests.
- `dual`: both roles on one machine with distinct listeners.

## Child repository commands

```bash
cd submodules/backend && scripts/ems-build.sh
cd submodules/frontend && yarn build
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

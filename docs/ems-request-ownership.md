# EMS Frontend Request Ownership Audit

Status: current integration audit for `replace-ems-web-with-open-source-platform`.

## Scope and source pins

- Backend contract snapshot: `../ems-backend/crates/ems-api/contracts/openapi-v1.json`
- Frontend source commit: `dda9c5a` (verified source batch; not a release pin)
- Backend source commit: `fdf1119` (verified source batch; not a release pin)
- Current comprehensive collector: `scripts/audit-frontend-requests.mjs`
- Historical direct-call records: `openspec/changes/replace-ems-web-with-open-source-platform/frontend-request-classification.json`

```sh
node scripts/audit-frontend-requests.mjs \
  --frontend ../ems-frontend \
  --openapi ../ems-backend/crates/ems-api/contracts/openapi-v1.json \
  --output /tmp/ems-request-audit.json
```

The collector records direct imported clients, callable/config-object and multipart
methods, lexical immutable URL constants, native streams and original Vue `apipath`
producers. Imported clients and constants are symbol-bound: a same-name local parameter
is not treated as the imported client or its URL. Operation candidates retain current
OpenAPI owner, permission and implementation metadata. External literal resources are
separate review rows. No historical expression inference is promoted to current proof.
Opaque registry values, wrapper arguments and dynamically assembled route paths still
require explicit current dataflow and producer review. The collector's actual disposable
TypeScript/Vue smoke covers these syntax and shadowing boundaries; it does not accept
product DTOs, admission or mutations.

The historical raw/classification records cover the current frozen source. Refreshed
against frontend `dda9c5a` and backend `fdf1119`: 461 files, 364 direct calls, 5
native streams and 27 template prop producers. They are not a complete current-runtime
inventory. The comprehensive collector must be refreshed again against the final frozen
source; in-flight source changes do not establish stable release counts. Historical
inferred dynamic expressions remain review evidence, not resolved owners. Native stream
constructors and template producers are now collected explicitly, but their admission
and producer contracts remain independent acceptance work.

## Deterministic classification

| Audit classification | Count | Integration decision |
| --- | ---: | --- |
| `exact-operation-candidate` | 65 | Exact operation candidates only; DTO, admission and semantics still require owner review. |
| `dynamic-operation-candidate` | 25 | Template-expression paths resolve to a declared operation; concrete dataflow still requires review. |
| `missing-declared-contract` | 246 | No exact declared operation; does not prove runtime absence. |
| `unresolved` | 28 | Prop-defined paths require current dataflow and producer ownership resolution. |
| `non-api-asset` | 1 | Image fetch outside API ownership. |
| **Total** | **364** | Every current direct-call row is retained; this is not full runtime request acceptance. |

The current classification preserves unresolved and historical-inference evidence. E174 direct search serves selector and explicit TMDB-only browse. E176 canonical catalog browse serves filtered TMDB discovery and mixed daily trending. E177/E178 serve TMDB person detail and filmography with current admission. Rich classification facts, other sources, media detail and music producers remain open.

Accepted local adapters now name concrete EMS owners: `api/adminUsers.ts` maps the
canonical paged directory/create/status contracts; `api/tmdbBrowse.ts` translates
retained TMDB-only view identifiers into E176 filters and direct DTOs;
`api/tmdbPeople.ts` maps E177/E178 person and filmography projections;
`api/tmdbRelations.ts` maps E179/E180/E181 fixed related/cast view paths and namespaces;
`api/tmdbDetail.ts` maps E182-E185 canonical detail, season and episode-group reads.
These adapters have focused behavior, actual HTTP and (for detail) real-browser evidence.
Other inherited requests are not accepted as adapters merely because their URL resembles
an EMS operation.

## Page-family ownership matrix

| Page family | Route owner | Current direct request status | Decision | Required failure states |
| --- | --- | --- | --- | --- |
| Authentication and setup | EMS auth/bootstrap | 32 contract-review rows | Reusable candidates; preserve current auth/session contracts | unauthorized, disabled, unavailable, validation, rate-limited |
| Dashboard | EMS admin/system | Legacy metrics and media rows remain missing-capability candidates | Not complete | forbidden, unavailable, empty, validation |
| Discovery | EMS discovery producer | TMDB catalog/person/relations/detail have canonical adapters; `discover/*`, `recommend/*` and other provider card/person paths remain unresolved or missing | Partial producer owner; other providers open | forbidden, unavailable, empty, provider failure |
| Resource search | EMS resource producer | `media/search` and dynamic resource paths remain missing-capability candidates | Missing producer owner | forbidden, unavailable, empty, validation |
| Music | EMS music producer | `music/album/*`, `music/artist/*`, `music/recognize` producer batch under active implementation | Producer batch in progress | forbidden, unavailable, empty, provider failure |
| Subscription and calendar | EMS subscription owner | Canonical durable subscription producers implemented and consumed (E197-E223); live browser create/list/transition/read/files/aggregates verified | Lifecycle owner implemented and migrated | forbidden, conflict, validation, unavailable |
| Workflow and organization | EMS operations owner | workflow/download/history/storage paths remain missing-capability candidates; `site/*` registry producers (E224-E242) are implemented and the retained site consumers resolve to declared operations | Site registry implemented; other operations owner missing | forbidden, validation, conflict, unavailable |
| Personal profile | EMS identity owner | `auth/me`, `auth/password`, `me/profile`, `me/avatar`, passkey paths have contract-review evidence | Reusable candidates with focused acceptance | unauthorized, disabled, conflict, validation, unavailable |
| Administration and settings | EMS admin/config owner | admin config, scheduler, metrics, plugins, bot and user paths have mixed contract-review evidence | Review each DTO/admission boundary | forbidden, conflict, validation, unavailable, rate-limited |
| Stream operations | EMS stream owner | Native EventSource/WebSocket paths are outside direct Axios audit | Separate stream-ticket audit required | unauthorized, forbidden, rate-limited, loop/startup failure |

The administrative user slice now consumes canonical paged `admin/users`, strict
ordinary creation and `admin/users/{id}/status` commands. Actual PostgreSQL/Redis
regressions and Chromium pagination/create/disable/restore passed. This does not clear
unrelated administration/settings producers or the full role-page gate.


## Role and failure contract

The page-family visibility/editability matrix in `docs/ems-role-matrix.md` is the authority for ordinary, VIP, whitelist, admin, and super-admin behavior. The request owner is not allowed to widen that matrix. Every retained request must preserve:

- anonymous UI redirect plus backend `401`;
- authenticated but unauthorized backend `403` and localized forbidden state;
- disabled and stale-session rejection;
- version conflicts as `409` without unrelated writes;
- rate limits as stable `429` with `Retry-After` when known;
- secret redaction from projections, OpenAPI, logs, and errors;
- unavailable provider/storage states distinct from empty successful results.

## Explicit open owner families

The following are not silently accepted as adapters or compatibility aliases:

- discovery source registry and provider DTOs (TMDB catalog/person/relations/detail now canonical; other sources open);
- recommendation source registry and item snapshots;
- media detail/person/credits/recommendation producers (TMDB detail/season/episode-group and related/cast now canonical; other providers open);
- music search, album, artist, and recognition producers (active implementation batch);
- subscription lifecycle and sharing producers;
- workflow, download, transfer-history, storage, tracker, and site producers;
- native search/media EventSource ticket and bearer admission;
- runtime plugin endpoint and declarative form producers.

These rows remain outstanding under tasks `1.1`, `4.1`, `4.2`, `4.3`, `4.4`, `7.3`, and `7.4`. This document records gaps, not a completed inventory or implemented producers.

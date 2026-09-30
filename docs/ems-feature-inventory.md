# EMS Feature and API Inventory

Status: proposed implementation gate for
`replace-ems-web-with-open-source-platform`.

This inventory is derived from the current frontend router/menu definitions and the
backend `planned-v1.json` and `openapi-v1.json` contracts. The integration repository
owns this document; source implementation remains in the pinned child repositories.

## Contract rules

- `Role` and `Tier` are independent dimensions.
- Roles are `user`, `admin`, and `super_admin`.
- User tiers are `normal`, `vip`, and `whitelist`; whitelist takes precedence when
  more than one entitlement source is present.
- `/login` is the only ordinary public UI route. `/initialize` is a one-time setup
  exception. Backend admission remains authoritative for every protected API.
- A page is not implementation-ready until its API, permission, error-state, and
  behavior-test references are recorded.
- Sensitive changes use explicit operations. Ordinary partial updates use an
  expected version; omitted fields remain unchanged.

## Frontend route inventory

| Page family | Routes | Client permission | User operation | Backend contract group |
| --- | --- | --- | --- | --- |
| Authentication and setup | `/login`, `/initialize`, `/service-status` | public/bootstrap | Login, setup, readiness | `/auth/*`, `/setup/*`, `/app/*` |
| Dashboard | `/dashboard` | `admin` | View system dashboard | `/admin/system`, `/stats/*` |
| App center | `/apps` | authenticated | View enabled capabilities | `/app/features`, `/app/version` |
| Discovery | `/recommend`, `/discover`, `/browse/:paths+`, `/credits/:paths+`, `/person`, `/media` | `discovery.*` | Search and inspect media | `/stats/*`, `/requests/*`, media contract |
| Resource search | `/resource`, `/music`, `/music/detail`, `/music/album`,
  `/music/artist`, `/music/artist/resources` | `search.resource` | Search and inspect resources | `/requests/*`, media contract |
| Subscription | `/subscribe/movie`, `/subscribe/tv`, `/subscribe/music`,
  `/subscribe-share`, `/calendar` | `subscribe.*` | Create and manage subscriptions | `/requests/*`, `/media/*` |
| Workflow and organization | `/workflow`, `/downloading`, `/history`, `/filemanager`, `/site` | `manage.*` | Manage approved media workflows | `/admin/config`, `/requests/*`, media contract |
| Personal profile | `/profile` | authenticated | View and update own profile | `/auth/me`, `/me/*`, `/points/*` |
| User administration | `/user` | `admin` | View scoped users and admin-owned actions | `/admin/users`, `/super/admins` |
| Plugin administration | `/plugins`, `/plugin-app/:pluginId/:navKey?` | `admin` | Manage approved plugins and entries | `/app/features`, plugin contract |
| System settings | `/setting` | `admin` | View and update approved configuration | `/admin/config`, `/admin/notify/*`, `/admin/bot/*` |
| Unknown route | `/:pathMatch(.*)*` | none | Render not-found state | none |

The route list above is the product-facing page inventory. Nested tabs are part of
these page families, not separate top-level permissions. The current tab inventory is:

- Discovery: recommendation categories, media-source exploration.
- Subscription: own subscriptions, popular content, sharing, calendar.
- Settings: system, directory, site, rule, search, subscription, notification.
- Plugins: installed plugins and marketplace.
- Workflow: workflow list and shared workflow view.

### Request ownership audit

The 2026-09-30 sibling-source audit parsed 492 non-test TypeScript/Vue files with
TypeScript ASTs and Vue SFC script extraction, retaining original source line numbers.
It found 452 Axios/fetch call sites and no SFC parse errors. This count excludes
template-generated calls, native EventSource construction, and runtime plugin dataflow;
it is not a claim of complete runtime request coverage.

Exact method/path comparison with the versioned snapshot, including evidenced constant
and template branches, currently yields 15 contract-review candidates, 429 call
sites without an exact declared operation, seven unresolved runtime/prop-defined call
sites, and one non-API image fetch. A missing declaration does not prove a missing
runtime handler. A matching URL does not prove DTO, admission, or mutation compatibility.

| Approved family | Observed inherited request families | Ownership gate |
| --- | --- | --- |
| Discovery and resource search | `discover/*`, `recommend/*`, `tmdb/*`, `douban/*`, `bangumi/*`, `anilist/*`, `search/*` | Exact provider, result and streaming contracts remain unmapped; `/requests/*` is not an equivalent search contract. |
| Music | `music/album/*`, `music/artist/*`, `music/recognize`, `media/search` | Album, artist and recognition DTO owners remain unmapped; media-account operations do not establish music-catalog ownership. |
| Subscription and calendar | `subscribe/*`, popular, shares, execution and batch operations | Subscription lifecycle and sharing/calendar contracts remain unmapped; request quotas do not establish subscription lifecycle ownership. |
| Workflow and organization | `workflow/*`, `download/*`, `history/*`, `storage/*`, `site/*` | Graph execution, downloads, transfer history, filesystem and tracker contracts require explicit owners; configuration read/write alone is insufficient. |
| Plugins | `plugin/*`, runtime dashboard/page configuration endpoints | Runtime endpoint expressions and executable plugin UI require explicit bounded contracts and admission review. |
| Personal identity | `auth/me`, `auth/login`, `auth/logout`, `me/profile`, `me/passkeys` | Exact path candidates exist; field casing, avatar validation, WebAuthn transactions and verified-state transitions must be checked against actual handlers. |

Additional native EventSource paths include search/subtitle streams, search/media
streams, `system/progress/{key}` and `system/logging`. None matches an exact operation
in the audited snapshot. Their constructors do not acquire a versioned stream ticket
or provide an Authorization header; bearer admission must not be assumed from the
Axios interceptor. These approved page families remain in scope. Tasks 1.1 and 4.1
remain open until every owning contract and runtime-generated request is resolved.

Canonical passkey login now uses `auth/passkey/auth/begin` and `/finish`. Profile
password changes use `PATCH auth/password` with `oldPassword`, `newPassword` and
`revokeOthers: true`, returning204. These corrections have real PostgreSQL/Redis
HTTP evidence, but public `auth/providers` capability ownership and complete browser
WebAuthn acceptance remain open; candidate counts are not acceptance counts.
The existing Telegram first-login owner is `MiniAppLogin::login_identity`, wired
through the signed Mini App verifier; it resolves or atomically creates an EMS
account before issuing a session. This is not a website OAuth callback or provider
discovery implementation. No `auth/providers` or website OAuth route was found in
the audited API/runtime sources. Google Drive OAuth configures storage and must
not be presented as an EMS login provider. Public provider discovery needs a real
capability owner and any advertised remote login needs its own verified flow.

The current self-profile handler does not accept arbitrary HTTPS avatar URLs:
`avatar: null` removes the avatar; a string must equal the operator's configured
`avatar_url` and requests existing-avatar validation. The inherited image-file
picker submits a data URL, which this handler rejects. `Avatar::upload` and
`api::avatar::router` already expose multipart `POST /me/avatar`: exactly one `file`
field, PNG/JPEG/WebP and a 2 MiB bound, returning `avatarUrl`. Private binary reads
require current authority. Migrate upload and authorized display together rather
than widening profile URL validation or claiming the upload owner is missing.

The inherited `FormRender` executes server-supplied expression and event strings
with `new Function` in the authenticated application origin. Plugin-form and
discovery-filter producers are absent from the audited backend declaration, and
no matching producer symbols or route literals were found in backend crates.
Runtime-evaluation lint enforcement reports four execution sites. Release remains
blocked until bounded expression/action contracts and real producers migrate
together. Disabling the rule or silently dropping events would hide the defect
or reduce the approved plugin/discovery behavior.

## Frontend feature permissions

| Feature key | Permission category | Route | Default audience |
| --- | --- | --- | --- |
| `discovery.recommend` | discovery | `/recommend` | VIP/whitelist when enabled |
| `discovery.explore` | discovery | `/discover`, `/browse`, `/media` | VIP/whitelist when enabled |
| `search.resource` | search | `/resource`, `/music` | VIP/whitelist when enabled |
| `subscribe.movie` | subscribe | `/subscribe/movie` | VIP/whitelist when enabled |
| `subscribe.tv` | subscribe | `/subscribe/tv` | VIP/whitelist when enabled |
| `subscribe.music` | subscribe | `/subscribe/music` | VIP/whitelist when enabled |
| `subscribe.calendar` | subscribe | `/calendar` | VIP/whitelist when enabled |
| `subscribe.share` | subscribe | `/subscribe-share` | VIP/whitelist when enabled |
| `manage.workflow` | manage | `/workflow` | admin-configured users |
| `manage.downloading` | manage | `/downloading` | admin-configured users |
| `manage.history` | manage | `/history` | admin-configured users |
| `manage.filemanager` | manage | `/filemanager` | admin-configured users |
| `manage.site` | manage | `/site` | admin-configured users |

The frontend feature flags are navigation hints only. The backend MUST independently
check the current principal, role, tier, permission, disabled state, and resource scope.

## Backend API inventory

Both backend snapshots currently contain 132 paths and 161 operations: 98 implemented
and 63 planned, as counted directly on 2026-09-30. Planned operations remain acceptance
gaps, not evidence of registered runtime handlers. The planned snapshot remains the
source for the complete target inventory.

## Target operation traceability

The target operation inventory is maintained in the pinned backend contract rather than
duplicated as a second generated JSON artifact. The following stable identifiers anchor
the page/API mapping and implementation status:

| Area | Representative operation IDs |
| --- | --- |
| Application and authentication | E001-E032 |
| User administration and identity | E033-E051 |
| Media accounts and playback | E053-E080 |
| Streams and system operations | E078, E082-E094, E158 |
| Requests, points, commerce and notifications | E095-E149 |
| Configuration, outbox and scheduler | E149-E160 |

Verification MUST compare every method/path in `planned-v1.json` with the registered
backend routes and retain the exact child commit that supplied the contract.

| API family | Path prefix | Scope and feature owner |
| --- | --- | --- |
| Public application | `/app/*` | Branding, feature discovery, version, login appearance |
| Authentication | `/auth/*` | Password, passkey, session, logout, Telegram Mini App |
| One-time setup | `/setup/*` | Bootstrap completion, initial admin, server, lines, key rotation |
| Personal identity | `/me/*` | Profile, avatar, passkeys, sessions, Telegram binding, selected line |
| Personal media | `/media/*` | Account lifecycle, claims, playback, media-server visibility |
| Personal requests | `/requests` and `/requests/*` | Requests, quotas, TMDB resolution |
| Personal points | `/points/*` and `/red-packets/*` | Balance, ledger, check-in, packets and claims |
| Personal shop | `/shop/*` | Products, codes, orders, self-service use |
| Public stream | `/lines` | Selectable line projection |
| Public OpenAPI | `/openapi.json` | Versioned contract export; protected at runtime per target design |
| Public statistics | `/stats/*` | Approved aggregate statistics |
| Admin users | `/admin/users*` | Scoped user directory, detail, status, avatar, chain-ban |
| Admin media | `/admin/media-*` | Media servers/accounts, claims, libraries, rules |
| Admin configuration | `/admin/config*` | Versioned configuration, explicit secret keep/replace/clear |
| Admin notifications and bot | `/admin/notify/*`, `/admin/bot*` | Provider, subscription and access configuration |
| Admin requests and scheduler | `/admin/requests*`, `/admin/scheduler/*` | Request governance and task operations |
| Admin points and shop | `/admin/points/*`, `/admin/shop/*` | Adjustments, reconciliation, products, codes, red packets |
| Admin streams | `/admin/stream*`, `/admin/streams*` | Nodes, lines, tickets, websocket transport |
| Admin system | `/admin/system*`, `/admin/audit-logs` | Status, logs, audit and one-use tickets |
| Admin outbox | `/admin/outbox/*` | Bounded job inspection and replay |
| Super administration | `/super/*` | Administrators, API keys, bootstrap and super-only controls |

The complete method/path list is generated from the pinned OpenAPI snapshot during
verification. Any route not represented by a page family or an explicit operational
owner is not approved for frontend exposure.

## Cross-cutting API requirements

| Area | Required contract |
| --- | --- |
| Authentication | Bearer/cookie admission, session restore, logout, disabled-user handling |
| Authorization | Backend role, tier, permission, and resource-scope checks |
| Partial updates | Typed field-level update with `expectedVersion` and conflict response |
| Secrets | Explicit set/clear or rotate operation; never arbitrary JSON merge |
| Swagger/OpenAPI | Versioned, secret-free document and protected locally hosted UI |
| Identity | Internal account UUID remains primary; Telegram and Emby are external bindings |
| Abuse protection | Bounded login, OAuth, binding, mutation, and expensive-read limits with safe 429 |
| Stream modes | Explicit `frontend`, `backend`, and `dual` listener/routing behavior |
| Errors | Localized unauthorized, forbidden, validation, conflict, unavailable, and rate-limit states |

## Inventory acceptance gate

Before frontend feature compilation, each retained page family MUST have:

1. one owner in this inventory;
2. one route and API contract;
3. a role/tier visibility and editability decision in `ems-role-matrix.md`;
4. explicit anonymous, forbidden, unavailable, validation, mutation, and mobile states;
5. a behavior test and an applicable browser smoke flow.

This inventory does not authorize backend implementation beyond the approved OpenSpec
contracts and does not make the frontend a security boundary.

## Exact API operation inventory

Observed from `submodules/backend/crates/ems-api/contracts/planned-v1.json`. Status is snapshot metadata, not proof of a registered handler. Each planned row remains an owning acceptance gap.

| Method | Path | Operation | Status | Owner | Task | Permission |
|---|---|---|---|---|---|---|
| GET | `/openapi.json` | E001 | implemented | define-v2-boundaries-contracts | openapi_contract | admin.system.read |
| GET | `/app/features` | E002 | implemented | implement-v2-config-runtime | public_appearance | public |
| GET | `/app/appearance` | E003 | implemented | implement-v2-config-runtime | public_appearance | public |
| GET | `/app/appearance/login-background` | E004 | implemented | implement-v2-config-runtime | public_appearance | public |
| GET | `/app/version` | E005 | implemented | implement-v2-config-runtime | public_appearance | public |
| GET | `/setup/status` | E006 | implemented | implement-v2-config-runtime | onboarding_origins | public |
| POST | `/setup/admin` | E007 | implemented | implement-v2-identity-access | bootstrap_contract | operator-bootstrap |
| POST | `/setup/media-server` | E008 | planned | implement-v2-media-accounts | media_servers | super-setup |
| POST | `/setup/lines` | E009 | implemented | implement-v2-stream-routing | line_management | super-setup |
| POST | `/setup/api-key/rotate` | E010 | implemented | implement-v2-identity-access | api_keys | super-setup |
| POST | `/setup/complete` | E011 | implemented | implement-v2-config-runtime | onboarding_origins | super-setup |
| POST | `/auth/register` | E012 | planned | implement-v2-invitation-governance | registration | public-policy |
| POST | `/auth/login` | E013 | implemented | implement-v2-identity-access | password_login | public |
| POST | `/auth/logout` | E014 | implemented | implement-v2-identity-access | session_lifecycle | authenticated |
| GET | `/auth/me` | E015 | implemented | implement-v2-identity-access | session_lifecycle | authenticated |
| PATCH | `/auth/password` | E016 | implemented | implement-v2-identity-access | self_password | self.manage |
| POST | `/auth/passkey/register/begin` | E017 | implemented | implement-v2-identity-access | passkey_registration | self.manage |
| POST | `/auth/passkey/register/finish` | E018 | implemented | implement-v2-identity-access | passkey_registration | self.manage |
| POST | `/auth/passkey/auth/begin` | E019 | implemented | implement-v2-identity-access | passkey_login | public |
| POST | `/auth/passkey/auth/finish` | E020 | implemented | implement-v2-identity-access | passkey_login | public |
| GET | `/me/passkeys` | E021 | implemented | implement-v2-identity-access | passkey_login | self.manage |
| DELETE | `/me/passkeys/{id}` | E022 | implemented | implement-v2-identity-access | passkey_login | self.manage |
| PATCH | `/me/profile` | E023 | implemented | implement-v2-identity-access | self_profile | self.manage |
| POST | `/me/avatar` | E024 | implemented | implement-v2-identity-access | avatar | self.manage |
| GET | `/me/avatar` | E025 | implemented | implement-v2-identity-access | avatar | self.manage |
| PUT | `/me/line` | E026 | implemented | implement-v2-stream-routing | line_queries | line.select |
| GET | `/me/sessions` | E027 | implemented | implement-v2-identity-access | session_lifecycle | self.manage |
| DELETE | `/me/sessions/{id}` | E028 | implemented | implement-v2-identity-access | session_lifecycle | self.manage |
| POST | `/me/telegram/bind-code` | E029 | implemented | implement-v2-bot-access | telegram_binding | self.manage |
| POST | `/me/telegram/link` | E030 | implemented | implement-v2-bot-access | telegram_binding | self.manage |
| GET | `/me/telegram/bindings` | E031 | implemented | implement-v2-bot-access | telegram_binding | self.manage |
| POST | `/auth/telegram/miniapp` | E032 | implemented | implement-v2-bot-access | miniapp_auth | signed-telegram |
| GET | `/admin/users` | E033 | implemented | implement-v2-identity-access | admin_directory | admin.users.read |
| GET | `/admin/users/{id}` | E034 | implemented | implement-v2-identity-access | admin_directory | admin.users.read |
| PATCH | `/admin/users/{id}/status` | E035 | implemented | implement-v2-identity-access | user_status | admin.users.disable |
| PATCH | `/admin/users/{id}/media-password` | E036 | implemented | implement-v2-media-accounts | media_password_reset | admin.media.write |
| GET | `/admin/users/{id}/tree` | E037 | planned | implement-v2-invitation-governance | invitation_tree | admin.users.read |
| GET | `/admin/users/{id}/chain-ban/preview` | E038 | planned | implement-v2-invitation-governance | chain_preview | super.chain-ban |
| POST | `/admin/users/{id}/chain-ban` | E039 | planned | implement-v2-invitation-governance | chain_execute | super.chain-ban |
| GET | `/admin/chain-ban-actions` | E040 | planned | implement-v2-invitation-governance | governance_history | super.chain-ban |
| POST | `/admin/chain-ban-actions/{id}/rollback` | E041 | planned | implement-v2-invitation-governance | chain_rollback | super.chain-ban |
| GET | `/admin/audit-logs` | E042 | implemented | establish-v2-persistence | audit_contract | admin.audit.read |
| GET | `/super/admins` | E043 | implemented | implement-v2-identity-access | admin_roles | super.admins.write |
| POST | `/super/admins` | E044 | implemented | implement-v2-identity-access | admin_roles | super.admins.write |
| DELETE | `/super/admins/{id}` | E045 | implemented | implement-v2-identity-access | admin_roles | super.admins.write |
| PATCH | `/super/admins/{id}/password` | E046 | implemented | implement-v2-identity-access | admin_password | super.admins.write |
| GET | `/super/api-keys` | E047 | implemented | implement-v2-identity-access | api_keys | super.apikeys.write |
| POST | `/super/api-keys` | E048 | implemented | implement-v2-identity-access | api_keys | super.apikeys.write |
| POST | `/super/api-keys/{id}/rotate` | E049 | implemented | implement-v2-identity-access | api_keys | super.apikeys.write |
| DELETE | `/super/api-keys/{id}` | E050 | implemented | implement-v2-identity-access | api_keys | super.apikeys.write |
| GET | `/super/bootstrap` | E051 | implemented | implement-v2-config-runtime | config_queries | super.bootstrap.read |
| GET | `/media/servers` | E052 | implemented | implement-v2-media-accounts | server_queries | media.self |
| GET | `/media/accounts` | E053 | implemented | implement-v2-media-accounts | account_queries | media.self |
| POST | `/media/accounts` | E054 | implemented | implement-v2-media-accounts | media_provision | media.self |
| POST | `/media/accounts/{id}/renew` | E055 | implemented | implement-v2-media-accounts | account_renewal | media.self |
| PATCH | `/media/accounts/{id}/password` | E056 | implemented | implement-v2-media-accounts | media_password_reset | media.self |
| POST | `/media/accounts/claim` | E057 | implemented | implement-v2-media-accounts | media_claim | media.self |
| GET | `/media/claims` | E058 | implemented | implement-v2-media-accounts | account_queries | media.self |
| GET | `/media/accounts/{id}/latency` | E059 | planned | implement-v2-stream-routing | latency_probes | media.self |
| GET | `/media/playback-info` | E060 | planned | implement-v2-stream-routing | playback_grant | media.self |
| GET | `/lines` | E061 | implemented | implement-v2-stream-routing | line_queries | line.select |
| GET | `/stats/latest-items` | E062 | implemented | implement-v2-media-observation | latest_items | stats.read |
| GET | `/stats/top5` | E063 | implemented | implement-v2-media-observation | top5 | stats.read |
| GET | `/stats/online-count` | E064 | implemented | implement-v2-media-observation | online_count | stats.read |
| GET | `/admin/media-servers` | E065 | implemented | implement-v2-media-accounts | server_queries | admin.config.media |
| POST | `/admin/media-servers` | E067 | implemented | implement-v2-media-accounts | media_servers | admin.config.media |
| GET | `/admin/media-servers/{id}` | E066 | implemented | implement-v2-media-accounts | server_queries | admin.config.media |
| PATCH | `/admin/media-servers/{id}` | E068 | implemented | implement-v2-media-accounts | media_servers | admin.config.media |
| POST | `/admin/media-servers/{id}/test` | E069 | implemented | implement-v2-media-accounts | server_probe | admin.config.media |
| GET | `/admin/media-servers/{id}/libraries` | E070 | implemented | implement-v2-media-accounts | library_rules | admin.libraries.write |
| PUT | `/admin/media-servers/{id}/library-rules` | E071 | implemented | implement-v2-media-accounts | library_rules | admin.libraries.write |
| GET | `/admin/media-accounts` | E072 | implemented | implement-v2-media-accounts | media_admin | admin.media.write |
| GET | `/admin/media-accounts/{id}` | E073 | implemented | implement-v2-media-accounts | media_admin | admin.media.write |
| PATCH | `/admin/media-accounts/{id}` | E074 | implemented | implement-v2-media-accounts | media_admin | admin.media.write |
| GET | `/admin/media-servers/{id}/claims` | E075 | implemented | implement-v2-media-accounts | media_admin | admin.media.claim_review |
| PATCH | `/admin/media-servers/{id}/claims/{claimId}` | E076 | implemented | implement-v2-media-accounts | claim_review | admin.media.claim_review |
| GET | `/admin/streams` | E077 | implemented | implement-v2-media-observation | device_statistics | admin.streams.watch |
| POST | `/admin/streams/ticket` | E078 | implemented | implement-v2-identity-access | stream_ticket | admin.streams.watch |
| GET | `/admin/streams/ws` | E079 | planned | implement-v2-media-observation | playback_stream | admin.streams.watch |
| GET | `/admin/device-stats` | E080 | planned | implement-v2-media-observation | device_statistics | admin.streams.watch |
| GET | `/admin/stream/nodes` | E081 | implemented | implement-v2-stream-routing | node_management | admin.config.media |
| POST | `/admin/stream/nodes` | E083 | implemented | implement-v2-stream-routing | node_management | admin.config.media |
| GET | `/admin/stream/nodes/{id}` | E082 | implemented | implement-v2-stream-routing | node_management | admin.config.media |
| PATCH | `/admin/stream/nodes/{id}` | E084 | implemented | implement-v2-stream-routing | node_management | admin.config.media |
| DELETE | `/admin/stream/nodes/{id}` | E085 | implemented | implement-v2-stream-routing | node_management | admin.config.media |
| GET | `/admin/stream/node-types` | E086 | implemented | implement-v2-stream-routing | node_manifest | admin.config.media |
| POST | `/admin/stream/nodes/test-pattern` | E087 | implemented | implement-v2-stream-routing | pattern_test | admin.config.media |
| POST | `/admin/stream/nodes/{id}/probe` | E088 | implemented | implement-v2-stream-routing | latency_probes | admin.config.media |
| GET | `/admin/stream/lines` | E089 | implemented | implement-v2-stream-routing | line_management | admin.config.media |
| POST | `/admin/stream/lines` | E091 | implemented | implement-v2-stream-routing | line_management | admin.config.media |
| GET | `/admin/stream/lines/{id}` | E090 | implemented | implement-v2-stream-routing | line_management | admin.config.media |
| PATCH | `/admin/stream/lines/{id}` | E092 | implemented | implement-v2-stream-routing | line_management | admin.config.media |
| DELETE | `/admin/stream/lines/{id}` | E093 | implemented | implement-v2-stream-routing | line_management | admin.config.media |
| PUT | `/admin/stream/lines/{id}/nodes` | E094 | implemented | implement-v2-stream-routing | line_management | admin.config.media |
| POST | `/points/checkin` | E095 | planned | implement-v2-points | checkin | points.self |
| GET | `/points/balance` | E096 | planned | implement-v2-points | points_queries | points.self |
| GET | `/points/ledger` | E097 | planned | implement-v2-points | points_queries | points.self |
| GET | `/red-packets` | E098 | planned | implement-v2-points | points_queries | points.self |
| POST | `/red-packets` | E101 | planned | implement-v2-points | packet_issuance | points.self |
| POST | `/red-packets/claims` | E099 | planned | implement-v2-points | packet_claims | points.self |
| GET | `/red-packets/mine-claims` | E100 | planned | implement-v2-points | points_queries | points.self |
| GET | `/red-packets/mine` | E102 | planned | implement-v2-points | points_queries | points.self |
| POST | `/admin/points/red-packets` | E103 | planned | implement-v2-points | packet_issuance | admin.shop.write OR super.redpacket.mint |
| GET | `/admin/points/red-packets` | E104 | planned | implement-v2-points | points_queries | admin.shop.write |
| GET | `/admin/points/red-packets/{id}` | E105 | planned | implement-v2-points | points_queries | admin.shop.write |
| POST | `/admin/points/red-packets/{id}/void` | E106 | planned | implement-v2-points | packet_void | admin.shop.write |
| POST | `/admin/points/adjust` | E107 | planned | implement-v2-points | points_adjustment | admin.points.adjust |
| GET | `/admin/points/adjust/limit` | E108 | planned | implement-v2-points | points_queries | admin.points.adjust |
| GET | `/admin/points/reconcile` | E109 | planned | implement-v2-points | points_reconciliation | admin.points.adjust |
| POST | `/admin/points/reconcile/{userId}/resolve` | E110 | planned | implement-v2-points | points_reconciliation | super.points.reconcile |
| GET | `/shop/products` | E111 | planned | implement-v2-commerce | product_visibility | shop.self |
| POST | `/shop/orders` | E112 | planned | implement-v2-commerce | purchases | shop.self |
| GET | `/shop/orders` | E113 | planned | implement-v2-commerce | code_inventory | shop.self |
| GET | `/shop/codes` | E114 | planned | implement-v2-commerce | code_inventory | shop.self |
| GET | `/shop/codes/{id}` | E115 | planned | implement-v2-commerce | code_inventory | shop.self |
| POST | `/shop/codes/{id}/use` | E116 | planned | implement-v2-commerce | code_dispatch | shop.self |
| GET | `/admin/shop/products` | E117 | planned | implement-v2-commerce | products | admin.shop.write |
| POST | `/admin/shop/products` | E119 | planned | implement-v2-commerce | products | admin.shop.write |
| GET | `/admin/shop/products/{id}` | E118 | planned | implement-v2-commerce | products | admin.shop.write |
| PATCH | `/admin/shop/products/{id}` | E120 | planned | implement-v2-commerce | products | admin.shop.write |
| DELETE | `/admin/shop/products/{id}` | E121 | planned | implement-v2-commerce | products | admin.shop.write |
| GET | `/admin/shop/codes` | E122 | planned | implement-v2-commerce | code_inventory | admin.shop.write |
| POST | `/admin/shop/codes/{id}/void` | E123 | planned | implement-v2-commerce | code_void | admin.shop.write |
| GET | `/requests/quota` | E124 | planned | implement-v2-media-requests | request_queries | request.self |
| GET | `/requests/tmdb/resolve` | E125 | planned | implement-v2-media-requests | tmdb_contract | request.self |
| POST | `/requests` | E126 | planned | implement-v2-media-requests | request_admission | request.self |
| GET | `/requests` | E127 | planned | implement-v2-media-requests | request_queries | request.self |
| GET | `/admin/requests` | E128 | planned | implement-v2-media-requests | request_admin | admin.request.write |
| PATCH | `/admin/requests/{id}/status` | E129 | planned | implement-v2-media-requests | request_admin | admin.request.write |
| GET | `/admin/requests/config` | E130 | planned | implement-v2-media-requests | request_admin | admin.request.write |
| GET | `/admin/notify/bots` | E131 | planned | implement-v2-notifications | notification_bots | admin.notify.write |
| POST | `/admin/notify/bots` | E133 | planned | implement-v2-notifications | notification_bots | admin.notify.write |
| GET | `/admin/notify/bots/{id}` | E132 | planned | implement-v2-notifications | notification_bots | admin.notify.write |
| PATCH | `/admin/notify/bots/{id}` | E134 | planned | implement-v2-notifications | notification_bots | admin.notify.write |
| DELETE | `/admin/notify/bots/{id}` | E135 | planned | implement-v2-notifications | notification_bots | admin.notify.write |
| POST | `/admin/notify/bots/{id}/test` | E136 | planned | implement-v2-notifications | notification_bots | admin.notify.write |
| GET | `/admin/notify/subscriptions` | E137 | planned | implement-v2-notifications | subscriptions | admin.notify.write |
| PUT | `/admin/notify/subscriptions` | E138 | planned | implement-v2-notifications | subscriptions | admin.notify.write |
| POST | `/admin/notify/preview/top5` | E139 | planned | implement-v2-notifications | notification_preview | admin.notify.write |
| GET | `/admin/bot` | E140 | planned | implement-v2-bot-access | bot_configuration | admin.notify.write |
| POST | `/admin/bot` | E141 | planned | implement-v2-bot-access | bot_configuration | admin.notify.write |
| PATCH | `/admin/bot` | E142 | planned | implement-v2-bot-access | bot_configuration | admin.notify.write |
| DELETE | `/admin/bot` | E143 | planned | implement-v2-bot-access | bot_configuration | admin.notify.write |
| GET | `/admin/bot/access` | E144 | planned | implement-v2-bot-access | group_admission | admin.bot.access |
| PUT | `/admin/bot/access` | E145 | planned | implement-v2-bot-access | group_admission | admin.bot.access |
| POST | `/admin/bot/access/probe` | E146 | planned | implement-v2-bot-access | group_admission | admin.bot.access |
| GET | `/admin/config` | E147 | implemented | implement-v2-config-runtime | config_queries | admin.config.write |
| GET | `/admin/config/{scope}` | E148 | implemented | implement-v2-config-runtime | config_queries | admin.config.write |
| PUT | `/admin/config/{scope}` | E149 | implemented | implement-v2-config-runtime | config_publication | admin.config.write |
| GET | `/admin/config/manifest` | E150 | implemented | implement-v2-config-runtime | config_queries | admin.config.write |
| GET | `/admin/config/{scope}/versions` | E151 | implemented | implement-v2-config-runtime | config_queries | super.bootstrap.read |
| GET | `/admin/scheduler/tasks` | E152 | implemented | implement-v2-task-execution | scheduler_queries | admin.scheduler.read |
| PATCH | `/admin/scheduler/tasks/{taskKey}` | E153 | implemented | implement-v2-task-execution | scheduler_update | admin.scheduler.write |
| POST | `/admin/scheduler/tasks/{taskKey}/run` | E154 | implemented | implement-v2-task-execution | scheduler_run | admin.scheduler.write |
| GET | `/admin/scheduler/runs` | E155 | implemented | implement-v2-task-execution | scheduler_queries | admin.scheduler.read |
| GET | `/admin/system` | E156 | implemented | implement-v2-task-execution | system_status | admin.system.read |
| GET | `/admin/system/logs` | E157 | implemented | implement-v2-task-execution | system_logs | admin.system.read |
| POST | `/admin/system/logs/ticket` | E158 | implemented | implement-v2-identity-access | stream_ticket | admin.system.read |
| GET | `/admin/outbox/jobs` | E159 | implemented | implement-v2-task-execution | outbox_replay | admin.system.read |
| POST | `/admin/outbox/jobs/{id}/replay` | E160 | implemented | implement-v2-task-execution | outbox_replay | admin.scheduler.write |
| GET | `/admin/users/{id}/avatar` | E161 | implemented | implement-v2-identity-access | avatar | admin.users.read |


## Current source routes and cutover classification

This source inventory does not change the approved page families above. Inherited pages remain in scope where the role matrix enables their feature and an owning EMS contract exists; missing owning contracts must be resolved before implementation, not silently treated as authorization to remove approved capabilities.

| Source path | Component | EMS classification |
|---|---|---|
| `/dashboard` | `../pages/dashboard.vue` | Admin dashboard |
| `/recommend` | `../pages/discover/recommend.vue` | Approved Discovery family; EMS contract mapping pending |
| `/discover` | `../pages/discover/index.vue` | Approved Discovery family; EMS contract mapping pending |
| `/resource` | `../pages/resource.vue` | Approved Resource search family; EMS contract mapping pending |
| `/music` | `../pages/music/index.vue` | Approved Resource search family; EMS contract mapping pending |
| `/music/detail` | `../pages/music/detail.vue` | Approved Resource search family; EMS contract mapping pending |
| `/music/album` | `../pages/music/album.vue` | Approved Resource search family; EMS contract mapping pending |
| `/music/artist` | `../pages/music/artist/index.vue` | Approved Resource search family; EMS contract mapping pending |
| `/music/artist/resources` | `../pages/music/artist/resources.vue` | Approved Resource search family; EMS contract mapping pending |
| `/subscribe/movie` | `../pages/subscribe/index.vue` | Approved Subscription family; EMS contract mapping pending |
| `/subscribe/tv` | `../pages/subscribe/index.vue` | Approved Subscription family; EMS contract mapping pending |
| `/subscribe/music` | `../pages/subscribe/index.vue` | Approved Subscription family; EMS contract mapping pending |
| `/subscribe-share` | `../pages/subscribe/share.vue` | Approved Subscription family; EMS contract mapping pending |
| `/workflow` | `../pages/workflow.vue` | Approved Workflow family; EMS contract mapping pending |
| `/calendar` | `../pages/subscribe/calendar.vue` | Approved Subscription family; EMS contract mapping pending |
| `/downloading` | `../pages/reorganize/downloading.vue` | Approved organization family; EMS contract mapping pending |
| `/history` | `../pages/reorganize/history.vue` | Approved organization family; EMS contract mapping pending |
| `/site` | `../pages/site.vue` | Approved organization family; EMS contract mapping pending |
| `/user` | `../pages/user/index.vue` | Admin user directory |
| `/profile` | `../pages/user/profile.vue` | Member profile and security |
| `/plugins` | `../pages/plugin/index.vue` | Approved Plugin family; owning EMS contract pending |
| `/plugin-app/:pluginId/:navKey?` | `../pages/plugin/app.vue` | Approved Plugin family; owning EMS contract pending |
| `/setting` | `../pages/setting.vue` | Versioned administration settings |
| `/browse/:paths+` | `../pages/discover/browse.vue` | Approved Discovery family; EMS contract mapping pending |
| `/credits/:paths+` | `../pages/discover/credits.vue` | Approved Discovery family; EMS contract mapping pending |
| `/person` | `../pages/discover/person.vue` | Approved Discovery family; EMS contract mapping pending |
| `/media` | `../pages/discover/media.vue` | Approved Discovery family; EMS contract mapping pending |
| `/filemanager` | `../pages/reorganize/filemanager.vue` | Approved organization family; EMS contract mapping pending |
| `/apps` | `../pages/appcenter.vue` | Member application shell |
| `login` | `../pages/login.vue` | Public authentication |
| `initialize` | `../pages/initialize.vue` | Public bootstrap/onboarding |
| `service-status` | `../pages/service-status.vue` | Service unavailable surface |
| `/:pathMatch(.*)*` | `../pages/[...all].vue` | Not-found surface |


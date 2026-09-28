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

The versioned OpenAPI contract currently contains 133 paths and 162 operations. The
planned snapshot contains 132 paths and 161 operations; it marks 86 operations as
implemented and 75 as planned. The current OpenAPI snapshot marks 87 operations as
implemented and 75 as planned. The planned snapshot remains the source for the complete
target inventory.

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

# EMS Role and Tier Visibility Matrix

Status: approved under the explicit full-delegation execution policy; TypeSafe-reviewed.

This matrix separates administrative role from entitlement tier. It is an integration
contract for the replacement frontend and does not grant permissions. Backend admission
remains authoritative.

## Dimensions

### Roles

| Role | Meaning | Administrative authority |
| --- | --- | --- |
| `user` | Ordinary account | No administrative routes; only explicitly granted self and entitlement features |
| `admin` | Administrator | Admin-scoped operations allowed by backend permission and resource scope |
| `super_admin` | Super administrator | Super-only administration, role changes, keys and bootstrap controls |

### Tiers

| Tier | Meaning | Entitlement behavior |
| --- | --- | --- |
| `normal` | No active VIP or whitelist entitlement | Normal account features only |
| `vip` | Active VIP entitlement | VIP-enabled features and lines |
| `whitelist` | Active whitelist entitlement | Whitelist takes precedence over VIP/normal where policies overlap |

Role and tier are independent. An administrator can have an ordinary, VIP, or
whitelist entitlement projection, but administration is controlled by role and explicit
permissions, not by tier.

## Page-family visibility and editability

Legend: `V` = visible/readable; `E` = editable/actionable; `—` = hidden/not available.
A visible page can still return backend `403` or `409` for resource-level checks.

| Page family | User / normal | User / VIP | User / whitelist | Admin / any tier | Super admin / any tier |
| --- | --- | --- | --- | --- | --- |
| Authentication and setup | V/E self | V/E self | V/E self | V/E self | V/E self; setup only when bootstrap exception is active |
| Dashboard | — | — | — | V | V/E according to system permissions |
| App center | V | V | V | V | V |
| Discovery | — | V/E approved actions | V/E approved actions | V/E approved actions | V/E approved actions |
| Resource search | — | V/E approved actions | V/E approved actions | V/E approved actions | V/E approved actions |
| Subscription | — | V/E own requests | V/E own requests | V/E own requests plus admin scope where granted | V/E own requests plus admin scope where granted |
| Workflow and organization | — unless explicitly granted | — unless explicitly granted | — unless explicitly granted | V/E by `manage.*` permission | V/E by `manage.*` permission |
| Personal profile | V/E self | V/E self | V/E self | V/E self | V/E self |
| User administration | — | — | — | V/E only allowed admin operations | V/E including super-only operations |
| Plugin administration | — | — | — | V/E by admin permission | V/E by admin permission |
| System settings | — | — | — | V/E by admin permission | V/E including super-only settings |
| Swagger/OpenAPI | — | — | — | V | V |
| Stream operations | — | V/E only through approved entitlement path | V/E only through approved entitlement path | V/E by stream permission | V/E by stream permission |

## Feature-level defaults for ordinary users

The following feature permissions are independent switches under the relevant category.
A backend policy can deny a feature even when the client flag is present.

| Feature | Normal | VIP | Whitelist |
| --- | --- | --- | --- |
| `discovery.explore` | V/E if enabled | V/E if enabled | V/E if enabled |
| `search.resource` | — | V/E if enabled | V/E if enabled |
| `subscribe.movie` | — | V/E if enabled | V/E if enabled |
| `subscribe.tv` | — | V/E if enabled | V/E if enabled |
| `subscribe.music` | — | V/E if enabled | V/E if enabled |
| `subscribe.calendar` | — | V/E if enabled | V/E if enabled |
| `subscribe.share` | — | V/E if enabled | V/E if enabled |
| `manage.workflow` | — unless explicitly granted | — unless explicitly granted | — unless explicitly granted |
| `manage.downloading` | — unless explicitly granted | — unless explicitly granted | — unless explicitly granted |
| `manage.history` | — unless explicitly granted | — unless explicitly granted | — unless explicitly granted |
| `manage.filemanager` | — unless explicitly granted | — unless explicitly granted | — unless explicitly granted |
| `manage.site` | — unless explicitly granted | — unless explicitly granted | — unless explicitly granted |

## Administrative edit boundaries

| Operation | Admin | Super admin |
| --- | --- | --- |
| Read scoped user directory and details | E/read if `admin.users.read` | E/read |
| Disable or restore a user | E if `admin.users.disable` | E |
| Edit a user or reset their password | E ordinary users only, no role or tier change, if `admin.users.update` | E, never a super admin |
| Delete (soft) a user | E ordinary users only, if `admin.users.delete` | E, never self or a super admin |
| Change ordinary/admin role | — | E if `super.admins.write`; self and super targets remain forbidden |
| Change user tier or entitlement | E only through approved resource and version contract | E |
| Update configuration | E by scope-specific permission | E, including super-only version history where documented |
| Manage media servers/accounts/claims | E by resource permission and owner scope | E by permission and scope |
| Manage stream nodes/lines | E if `admin.streams.watch` or the specific write permission | E |
| Manage notifications and bot access | E by specific admin permission | E |
| Issue/revoke/rotate API keys | — | E by `super.apikeys.write` |
| Inspect protected Swagger/OpenAPI | V | V |
| Bootstrap setup | Only one-time setup exception | Only one-time setup exception |

## Mandatory failure behavior

- Anonymous users are redirected from protected UI routes and receive backend `401`.
- Authenticated users without permission receive backend `403` and a localized forbidden
  state; the frontend never treats a hidden navigation item as authorization.
- Disabled users cannot use authenticated flows; session restore must expose the
  disabled state rather than silently creating a new session.
- Stale versions return `409` without changing omitted or unrelated fields.
- Rate-limited login, OAuth, binding, mutation, and expensive-read operations return
  stable `429` with `Retry-After` when known and no durable side effect.
- Secret fields are never returned in page data, OpenAPI, logs, or errors.

## Approval gate

Approval authority is the user's instruction to complete all unfinished OpenSpec work
under `openspec/execution-policy.md`, which explicitly delegates within-scope choices
to actual TypeSafe review and agent execution. This is delegated approval, not a claim
that the user separately reviewed every matrix row.

On 2026-09-30, the actual TypeSafe review selected `record_delegated_approval` with
confidence 1.0 (HTTP 200); the contract consistency review returned yes-probability 0.82.
The request/response records remain in the ignored owning OpenSpec change artifacts.
The visibility/editability matrix above is frozen without adding capabilities. Each
retained page still requires its owning API contract, failure states, behavior tests,
and browser smoke evidence before implementation acceptance.

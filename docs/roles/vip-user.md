# VIP User

## Scope

A VIP user has role `user` and active tier `vip`. Tier grants entitlement only; it does
not grant administrative authority.

## Visible capabilities

All ordinary-user capabilities plus backend-approved VIP discovery, search, subscription,
media, stream and points features. Feature-level flags remain independent and backend
admission remains authoritative.

## Editable capabilities

Own profile, sessions, passkeys, Telegram binding, selected line, requests, subscriptions,
media-account actions and other self-scoped mutations covered by the API contract. VIP
entitlements do not authorize user, configuration, plugin, Swagger or super operations.

## Required states

The client must distinguish expired or unavailable VIP entitlement from authentication,
forbidden, validation, conflict and rate-limit errors. It must not infer access from a
client-side tier label.

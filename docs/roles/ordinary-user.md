# Ordinary User

## Scope

An ordinary user has role `user`. Entitlement is evaluated separately as `normal`,
`vip`, or `whitelist`, with whitelist precedence where policies overlap.

## Visible capabilities

- Login, session restore, logout, and disabled-session feedback.
- App center and own profile/session/passkey/Telegram views allowed by the API contract.
- TMDB search and media requests (requests also need an active media account),
- VIP or whitelist subscription, points, shop, stream and media
  capabilities only when the backend grants the corresponding entitlement and feature.
- Own resource history and status projections that are explicitly marked self-scoped.

## Editable capabilities

- Own profile, avatar, password/passkey/session state, Telegram binding, selected line,
  and other self-owned resources through typed contracts.
- Own requests, subscriptions, media-account actions, points and shop actions where the
  backend contract permits them.

## Not visible

- User administration, system settings, plugins, protected Swagger, super administration,
  other users' resources, and admin-only streams or diagnostics.

## Required states

Anonymous, forbidden, disabled, stale session, validation, conflict, unavailable and
rate-limited responses must be rendered without exposing protected data or secrets.

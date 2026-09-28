# Whitelist User

## Scope

A whitelist user has role `user` and active tier `whitelist`. Whitelist is the effective
tier when multiple entitlement sources overlap.

## Visible capabilities

All ordinary-user capabilities plus backend-approved whitelist discovery, search,
subscription, media, stream and points features. The exact feature set remains controlled
by backend policy and explicit feature flags.

## Editable capabilities

Own profile, sessions, passkeys, Telegram binding, selected line, requests, subscriptions,
media-account actions and other self-scoped mutations covered by the API contract.
Whitelist status never grants administrative or super-administrative operations.

## Required states

The client must display entitlement expiry, forbidden, validation, conflict, unavailable,
disabled, stale-session and rate-limit states distinctly, without revealing protected
account or secret data.

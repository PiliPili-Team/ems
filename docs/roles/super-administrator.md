# Super Administrator

## Scope

A super administrator has role `super_admin`. Super authority is still subject to backend
admission, current session revision, disabled status and explicit contract checks.

## Visible capabilities

All approved self and administrator capabilities plus super-scoped administrator lists,
role transitions, API-key lifecycle, bootstrap projections, protected configuration history,
reconciliation and other explicitly documented super operations.

## Editable capabilities

Super-only role transitions, API-key issue/revoke/rotate, bootstrap controls and other
super contracts. Role changes remain atomic, audited and subject to target restrictions;
self and super targets cannot be changed through ordinary admin transitions.

## Security boundaries

External Telegram or Emby identifiers never become primary identity. Secrets are delivered
only through one-time explicit operations and are not returned in projections, OpenAPI,
logs or errors. Frontend visibility never grants access; the backend re-admits every
protected operation.

## Required states

The UI must distinguish unauthorized, forbidden, conflict, validation, dependency
unavailable and rate-limit outcomes, including post-commit uncertainty where the API
contract exposes it.

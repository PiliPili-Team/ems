# Administrator

## Scope

An administrator has role `admin`. Tier remains independent and does not replace explicit
admin permissions or resource scope.

## Visible capabilities

- All self-scoped capabilities available to the current account.
- Dashboard, scoped user administration, approved media/configuration/notification/bot,
  request, scheduler, points, shop, stream, system and Swagger views according to the
  specific backend permission.
- Only resources within the current administrator scope.

## Editable capabilities

Admin operations use typed field-level updates and expected versions. Sensitive values,
roles, permissions and external identities require dedicated set/clear/grant/revoke/
bind/unbind operations. An administrator cannot perform super-only role, key or bootstrap
operations unless a separate contract explicitly grants them.

## Required states

The UI must handle `401`, `403`, `409`, validation, unavailable and `429` responses without
turning route guards into authorization. Resource scope and backend admission are checked
for every request.

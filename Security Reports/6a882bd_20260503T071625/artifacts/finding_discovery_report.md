# Finding Discovery

## Scope

Diff-focused review of the working tree changes against the current `HEAD`, with repository-scope threat modeling.

## Reviewed controls

- Browser auth/login/logout flow.
- CSRF token issuance and enforcement.
- BFF proxy forwarding and method gating.
- Backend Bearer JWT validation and profile lookup.
- Sales and cash write paths.
- Supabase/Postgres invariants and triggers.

## Candidate outcome

No technically plausible security findings survived discovery.

## Rationale

- Browser state-changing endpoints were updated to require CSRF and the client now sends matching headers.
- Backend sales and cash routes continue to require authenticated users through `require_user`.
- The new SQL invariants add integrity enforcement for cash movements and sales-linked cash activity.
- The catch-all BFF proxy forwards requests to the backend, but the backend routes inspected in this scan remain permission-gated.

## Notes

- The working tree also includes test updates that align with the new enforcement rules.
- I did not identify a standalone auth bypass, CSRF bypass, or direct injection surface in the reviewed diff.

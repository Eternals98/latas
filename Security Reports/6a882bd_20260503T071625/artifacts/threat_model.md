# Threat Model

Repository scope: full LATAS sales stack, including `web/`, `backend/`, and `supabase/`.

## Primary trust boundaries

- Browser to Next.js app routes.
- Next.js BFF routes to the FastAPI backend over `BACKEND_API_URL`.
- FastAPI backend to Supabase JWT verification and Postgres.
- Application code to direct SQL migrations and RLS / trigger enforcement.

## High-value assets

- Session tokens and user identity.
- Cash session integrity, especially open/close, delivery, and adjustment flows.
- Sales records and payment allocations.
- Audit logs and cash event history.
- Postgres RLS and trigger invariants.

## Main threat themes

- Cross-site request forgery against state-changing browser endpoints.
- Authentication and authorization bypass through proxy or token handling mistakes.
- Privilege escalation in cash management actions.
- Integrity failures in SQL migrations, triggers, or model/schema drift.
- Data exposure through overly broad BFF or backend routes.

## Assumptions

- The browser-origin app is the primary user entrypoint.
- Backend endpoints are intended to enforce user identity via Bearer JWTs.
- CSRF protection relies on the double-submit token pattern used by the frontend.

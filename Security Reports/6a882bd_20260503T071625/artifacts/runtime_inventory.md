# Runtime Inventory

## Frontend

- Next.js app routes under `web/app`.
- Browser-facing auth login/logout/session routes.
- BFF proxy routes under `web/app/api/bff`.
- Client-side CSRF header helper under `web/lib/csrf-client.ts`.

## Backend

- FastAPI app under `backend/src/api`.
- Protected sales and cash routes that depend on Supabase JWT auth.
- Shared auth verification in `backend/src/services/supabase_auth.py`.
- Cash and sales business logic in `backend/src/services/cash_service.py` and `backend/src/services/sales_service.py`.

## Data layer

- SQLAlchemy models in `backend/src/models`.
- Supabase/Postgres migrations in `supabase/migrations`.
- Trigger and RLS logic in SQL migrations.

## Security-sensitive boundaries

- Bearer token propagation from `web/lib/auth.ts` to backend calls.
- CSRF validation on browser-triggered POST/PUT/DELETE routes.
- Authenticated cash movement and sales creation flows.
- Automatic profile creation in backend auth resolution.

## Reviewed diff surfaces

- `web/app/api/auth/login/route.ts`
- `web/app/api/auth/logout/route.ts`
- `web/app/api/auth/session/route.ts`
- `web/app/api/bff/[...path]/route.ts`
- `web/app/api/bff/sales/route.ts`
- `web/app/api/bff/sales/[id]/route.ts`
- `web/lib/auth.ts`
- `web/lib/backend.ts`
- `web/lib/csrf.ts`
- `web/lib/csrf-client.ts`
- `backend/src/services/supabase_auth.py`
- `backend/src/services/sales_service.py`
- `backend/src/services/cash_service.py`
- `supabase/migrations/20260501092416_init_schema_and_seed.sql`
- `supabase/migrations/202605030002_search_indexes_and_db_invariants.sql`
- `backend/tests/*` supporting changes

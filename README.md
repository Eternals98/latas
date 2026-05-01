# LATAS Monorepo

Arquitectura activa:
- `web/`: Next.js (Vercel)
- `backend/`: FastAPI (Render)
- `supabase/`: esquema SQL fase 1

## Fase 1 implementada

Incluye:
- Modelo base de datos nuevo (`companies`, `profiles`, `customers`, `payment_methods`, `cash_sessions`, `transactions`, `transaction_payments`, `cash_movements`, `audit_logs`).
- Autenticación con Supabase Auth.
- Backend base con JWT validation (`/api/auth/me`, `/api/payment-methods`, `/api/companies`, `/api/customers`, `/api/health`).
- Frontend con login/logout/session sobre Supabase.

## Estado Fase 2 (ventas)

- Nuevo flujo activo de ventas en `web/app/registro` y backend `POST/GET /api/sales`, implementado sobre `transactions` + `transaction_payments`.
- `web/legacy` queda como referencia temporal y no debe usarse para nuevas funcionalidades.
- Endpoints legacy (`/api/ventas`, `/api/clientes`, `/api/medios-pago`) se mantienen solo por compatibilidad transitoria.
- No se cargan datos semilla automáticos al iniciar backend.

## Reset limpio BD (ejecutar en Supabase SQL Editor)

```sql
drop table if exists public.pago;
drop table if exists public.venta;
drop table if exists public.medio_pago;
drop table if exists public.cliente;
drop table if exists public.admin_user;
```

Luego aplicar `supabase/schema.sql`.

## Variables de entorno

### Local - Backend (`backend/.env`)

```env
APP_ENV=local
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=sqlite:///./ventas.db
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key-opcional-fallback-auth>
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_ISSUER=https://<project-ref>.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWKS_CACHE_TTL_SECONDS=300
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-opcional-fallback-auth>
```

### Producción - Backend Render (`backend/.env`)

```env
APP_ENV=production
APP_HOST=0.0.0.0
APP_PORT=10000
DATABASE_URL=postgresql+psycopg://postgres:<password>@<host>:5432/postgres?sslmode=require
CORS_ORIGINS=http://localhost:3000,https://<frontend>.vercel.app
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key-opcional-fallback-auth>
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_JWT_ISSUER=https://<project-ref>.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_JWKS_CACHE_TTL_SECONDS=300
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### Frontend Vercel (`web/.env.local`)

```env
BACKEND_API_URL=https://<backend>.onrender.com
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
```

### Supabase Project Settings

- `JWT issuer`: `https://<project-ref>.supabase.co/auth/v1`
- `JWKS endpoint`: `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`
- Claves usadas por backend/frontend: `anon` y `service_role`.

## Runbook base de datos

### Reinicio local SQLite

1. Detener backend.
2. Borrar `backend/ventas.db`.
3. Ejecutar:
   - `cd backend`
   - `python -m src.db.init_db`

Nota: `init_db` solo crea tablas en SQLite local.

### Reset Supabase (entorno remoto)

1. Ejecutar limpieza legacy (bloque `drop table ...` de este README).
2. Aplicar `supabase/schema.sql` desde SQL Editor.
3. Verificar tablas y policies con `supabase/verify_rls_sales.sql`.

Nota: no ejecutar `Base.metadata.create_all` contra Supabase/Postgres.

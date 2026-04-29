# Migracion Fase 1: Next.js + Supabase + Vercel (Hibrido)

## 1) Nuevo frontend principal

- Carpeta: `web/` (Next.js App Router).
- BFF inicial en rutas:
  - `GET /api/bff/dashboard` -> `GET {BACKEND_API_URL}/api/dashboard`
  - `GET /api/bff/ventas?mes=&anio=` -> `GET {BACKEND_API_URL}/api/ventas?...`
  - `POST /api/bff/ventas` -> `POST {BACKEND_API_URL}/api/ventas`
- Auth de acceso UI:
  - `POST /api/auth/login`
  - Middleware protege rutas privadas con cookie de sesion.

## 2) Supabase/Postgres

- Esquema base: `supabase/schema.sql`.
- Incluye tablas `cliente`, `medio_pago`, `venta`, `pago`.
- Incluye constraints basicas, indices y RLS habilitado.

## 3) Migracion de datos SQLite -> Supabase

Script:

```bash
cd backend
python scripts/migrate_sqlite_to_supabase.py --sqlite-path ./ventas.db --pg-dsn "postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
```

Valida:
- Conteo por tabla
- Suma total de `venta.valor_total`

## 4) Seguridad backend

- Ya no existen secretos seguros por defecto en runtime.
- `ADMIN_PASSWORD` y `ADMIN_JWT_SECRET` son obligatorios al arranque.
- CORS configurable por `CORS_ORIGINS`.

## 5) Resend y job diario

- Endpoint cron: `GET /api/cron/daily-report`.
- Protegido por `Authorization: Bearer ${CRON_SECRET}`.
- Envia dashboard diario por correo via Resend.
- Programacion Vercel: `web/vercel.json` (22:00 UTC diario).

## 6) Variables requeridas

`web/.env.example`:
- `BACKEND_API_URL`
- `SESSION_SECRET`
- `ADMIN_UI_PASSWORD`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `REPORT_EMAIL_FROM`
- `REPORT_EMAIL_TO`

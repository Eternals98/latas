# Documentación de configuración del proyecto LATAS

Este documento resume la configuración real del repositorio actual:

- `web/`: frontend Next.js
- `backend/`: API FastAPI
- `supabase/`: esquema y migraciones Postgres/Supabase

La referencia principal de arquitectura también está en [README.md](./README.md).

## 1. Estructura general

### Frontend

- Framework: Next.js 16 con App Router.
- Lenguaje: TypeScript.
- Autenticación: sesión con cookies HTTP-only emitidas por rutas internas de Next.
- El frontend no habla directo con el backend en la mayoría de los casos; usa una capa BFF en `web/app/api/bff/*`.

### Backend

- Framework: FastAPI.
- ORM: SQLAlchemy 2.
- Base de datos: Postgres/Supabase.
- Auth: validación de JWT de Supabase en `require_user` / `require_admin`.
- El backend expone el contrato de negocio para catálogos, ventas, caja, dashboard y migración histórica.

### Base de datos

- Postgres administrado por Supabase.
- El esquema está versionado en `supabase/migrations/*`.
- Hay RLS activado en las tablas sensibles.
- La identidad operativa sale de `public.profiles`, que se sincroniza desde `auth.users`.

## 2. Rutas importantes del repositorio

### Raíz

- [README.md](./README.md): resumen de arquitectura y variables.
- [.env.local](./.env.local): variables locales del frontend y del entorno Vercel.
- [start-backend.ps1](./start-backend.ps1): arranque local del backend.
- [start-frontend.ps1](./start-frontend.ps1): arranque local del frontend.

### Backend

- [backend/src/api/main.py](./backend/src/api/main.py): punto de entrada FastAPI.
- [backend/src/core/config.py](./backend/src/core/config.py): carga de variables.
- [backend/src/db/session.py](./backend/src/db/session.py): engine y sesión SQLAlchemy.
- [backend/src/db/init_db.py](./backend/src/db/init_db.py): helper local, no crea esquema en Supabase.
- [backend/src/api/routes/*](./backend/src/api/routes): endpoints HTTP.
- [backend/src/api/schemas/*](./backend/src/api/schemas): contratos request/response.
- [backend/src/models/*](./backend/src/models): modelos ORM.

### Frontend

- [web/app/layout.tsx](./web/app/layout.tsx): layout raíz, shell autenticado.
- [web/proxy.ts](./web/proxy.ts): protección por cookies para rutas privadas.
- [web/app/api/auth/*](./web/app/api/auth): login, logout y lectura de sesión.
- [web/app/api/bff/*](./web/app/api/bff): proxy hacia el backend.
- [web/app/*/page.tsx](./web/app): páginas protegidas y vistas.
- [web/lib/*](./web/lib): cliente Supabase, CSRF, backend fetch, sesión.

### Supabase

- [supabase/config.toml](./supabase/config.toml): configuración local del proyecto Supabase.
- [supabase/migrations/001_init_schema_and_seed.sql](./supabase/migrations/001_init_schema_and_seed.sql): esquema base.
- [supabase/migrations/002_search_indexes_and_db_invariants.sql](./supabase/migrations/002_search_indexes_and_db_invariants.sql): índices, triggers e invariantes.
- [supabase/migrations/003_seed_profiles_from_auth_users.sql](./supabase/migrations/003_seed_profiles_from_auth_users.sql): sincronización de perfiles desde Auth.
- [supabase/migrations/004_enforce_rls_and_cash_permissions.sql](./supabase/migrations/004_enforce_rls_and_cash_permissions.sql): RLS y permisos.

## 3. Variables de entorno

### Backend: `backend/.env`

Variables observadas en el proyecto:

- `APP_ENV`
- `APP_HOST`
- `APP_PORT`
- `DATABASE_URL`
- `CORS_ORIGINS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWKS_URL`
- `SUPABASE_JWT_ISSUER`
- `SUPABASE_JWT_AUDIENCE`
- `SUPABASE_JWKS_CACHE_TTL_SECONDS`
- `SUPABASE_SERVICE_ROLE_KEY`

Ejemplo de uso:

- `DATABASE_URL` alimenta `sqlalchemy.create_engine(...)`.
- `CORS_ORIGINS` alimenta `CORSMiddleware`.
- `SUPABASE_URL` y/o `SUPABASE_JWKS_URL` se usan para validar JWT.

### Frontend: `web/.env.local`

Variables observadas:

- `BACKEND_API_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CRON_SECRET`
- `RESEND_API_KEY`
- `REPORT_EMAIL_FROM`
- `REPORT_EMAIL_TO`

### Vercel

En [web/vercel.json](./web/vercel.json) existe una tarea programada:

- `GET /api/cron/daily-report`
- horario: `0 22 * * *`

## 4. Frontend: cómo está construido

### Flujo de autenticación

1. El usuario entra en `/login`.
2. La UI llama `POST /api/auth/login` en el propio frontend.
3. Esa ruta usa Supabase Auth y escribe cookies:
   - cookie de acceso
   - cookie de expiración
   - cookie CSRF
4. `web/proxy.ts` bloquea rutas privadas si la cookie falta o está expirada.
5. `GET /api/auth/session` consulta al backend para obtener el rol real del usuario.

### Protecciones de navegación

- `web/proxy.ts` redirige a `/login` cuando no hay sesión válida.
- `web/app/layout.tsx` envuelve el contenido con `AppShell` si hay cookie de autenticación.
- `requireAdminSession()` protege páginas de administración.

### Capa BFF

El frontend usa rutas internas tipo:

- `/api/bff/companies`
- `/api/bff/payment-methods`
- `/api/bff/customers`
- `/api/bff/cash/today`
- `/api/bff/sales`
- `/api/bff/sales/[id]`
- `/api/bff/dashboard`
- `/api/bff/admin/historic-migration`

Estas rutas reenvían al backend usando `BACKEND_API_URL` y mantienen el contrato del navegador estable.

### UI principal

- `/login`: inicio de sesión.
- `/dashboard`: dashboard de negocio.
- `/salesRegister`: registro de ventas.
- `/transactions`: historial/transacciones.
- `/clientes`: clientes.
- `/cash-management`: caja.
- `/configuracion`: configuración administrativa.
- `/reportes`: vista base de reportes.

## 5. Backend: cómo está construido

### Punto de entrada

El backend arranca desde [backend/src/api/main.py](./backend/src/api/main.py):

- crea la app FastAPI `LATAS Ventas API`
- habilita CORS
- registra routers

Routers montados:

- `health`
- `auth`
- `cash`
- `payment_methods`
- `companies`
- `customers`
- `dashboard`
- `sales`
- `historic_migration`

### Conexión a base de datos

- [backend/src/db/session.py](./backend/src/db/session.py) crea el `engine` con `DATABASE_URL`.
- `get_db()` entrega sesiones SQLAlchemy por request.
- [backend/src/db/base.py](./backend/src/db/base.py) define la base declarativa.

### Autenticación y permisos

- `require_user` valida usuario autenticado con JWT de Supabase.
- `require_admin` exige rol admin.
- `Profile` vive en `public.profiles`.

### Servicios de negocio

El backend separa el acceso HTTP de la lógica real en `src/services/*`:

- ventas
- caja
- dashboard
- migración histórica
- autenticación Supabase

## 6. Endpoints del backend

### 6.1 Salud

#### `GET /api/health`

- Archivo: [backend/src/api/routes/health.py](./backend/src/api/routes/health.py)
- Respuesta `200`:

```json
{"status":"ok"}
```

### 6.2 Autenticación

#### `GET /api/auth/me`

- Archivo: [backend/src/api/routes/auth.py](./backend/src/api/routes/auth.py)
- Requiere usuario autenticado.
- Respuesta `200`:

```json
{
  "id": "uuid",
  "full_name": "Nombre",
  "role": "admin"
}
```

### 6.3 Catálogos

#### `GET /api/companies`

- Archivo: [backend/src/api/routes/companies.py](./backend/src/api/routes/companies.py)
- Requiere usuario autenticado.
- Devuelve lista ordenada por `name`.
- Respuesta: array de empresas activas.

#### `GET /api/customers?search=texto`

- Archivo: [backend/src/api/routes/customers.py](./backend/src/api/routes/customers.py)
- Requiere usuario autenticado.
- Filtra por `name` o `phone` con `ilike`.
- Solo clientes activos.
- Límite actual: `50`.

#### `GET /api/payment-methods`

- Archivo: [backend/src/api/routes/payment_methods.py](./backend/src/api/routes/payment_methods.py)
- Requiere usuario autenticado.
- Solo métodos activos.
- Orden por `name`.

### 6.4 Dashboard

#### `GET /api/dashboard`

- Archivo: [backend/src/api/routes/dashboard.py](./backend/src/api/routes/dashboard.py)
- Requiere usuario autenticado.
- Respuesta `200` con:
  - `ventas_por_mes`
  - `ventas_por_empresa`
  - `metodos_pago`
  - `ticket_promedio`
  - `total_ventas`
  - `total_mes_actual`
  - `cantidad_ventas`
  - `generado_en`

Formato de montos:

- los decimales se serializan como strings con dos decimales.

### 6.5 Ventas

#### `POST /api/sales`

- Archivo: [backend/src/api/routes/sales.py](./backend/src/api/routes/sales.py)
- Requiere usuario autenticado.
- Crea una venta con sus pagos.
- Respuesta `201`:
  - venta creada
  - empresa
  - cliente opcional
  - lista de pagos

Errores documentados:

- `400` por validación
- `409` por conflicto de negocio

#### `GET /api/sales`

- Archivo: [backend/src/api/routes/sales.py](./backend/src/api/routes/sales.py)
- Requiere usuario autenticado.
- Filtros:
  - `date_from`
  - `date_to`
  - `company_id`
  - `company_ids`
  - `payment_method_ids`
  - `search`
  - `limit`
  - `offset`
- Respuesta:

```json
{
  "items": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

#### `GET /api/sales/{sale_id}`

- Archivo: [backend/src/api/routes/sales.py](./backend/src/api/routes/sales.py)
- Requiere usuario autenticado.
- Respuesta `200`: detalle de una venta.
- Errores:
  - `400`
  - `404`

#### `PUT /api/sales/{sale_id}`

- Archivo: [backend/src/api/routes/sales.py](./backend/src/api/routes/sales.py)
- Requiere admin.
- Actualiza venta y pagos.
- Errores:
  - `400`
  - `403`
  - `404`
  - `409`

#### `DELETE /api/sales/{sale_id}`

- Archivo: [backend/src/api/routes/sales.py](./backend/src/api/routes/sales.py)
- Requiere admin.
- Cancela una venta.
- Recibe razón y `impact_cash`.
- Errores:
  - `400`
  - `403`
  - `404`
  - `409`

### 6.6 Caja

#### `POST /api/cash/open`

- Archivo: [backend/src/api/routes/cash.py](./backend/src/api/routes/cash.py)
- Requiere usuario autenticado.
- Abre una caja para una fecha.
- Errores:
  - `403`
  - `409`

#### `POST /api/cash/delivery`

- Registra entrega a bóveda.
- Requiere caja abierta para la fecha.
- Errores:
  - `404`
  - `409`

#### `POST /api/cash/adjustment`

- Ajuste manual de caja.
- Requiere razón y dirección `in|out`.
- Errores:
  - `403`
  - `404`
  - `409`

#### `POST /api/cash/close`

- Cierra la caja del día.
- Recibe `counted_cash`.
- Errores:
  - `403`
  - `404`
  - `409`

#### `GET /api/cash/today?session_date=YYYY-MM-DD`

- Devuelve:
  - `session`
  - `movements`
- Si no existe caja para la fecha, responde `404`.

#### `GET /api/cash/history`

- Filtros:
  - `date_from`
  - `date_to`
  - `status`
- Respuesta:

```json
{
  "items": [],
  "total": 0
}
```

#### `GET /api/cash/events`

- Devuelve el historial de eventos de caja.
- Incluye etiqueta humana del evento:
  - `open`
  - `close`
  - `delivery`
  - `reopen`

### 6.7 Migración histórica

#### `POST /api/admin/historic-migration`

- Archivo: [backend/src/api/routes/historic_migration.py](./backend/src/api/routes/historic_migration.py)
- Requiere admin.
- Recibe:
  - `file` como `multipart/form-data`
  - `month` opcional
- Respuesta `200` con resumen de importación.
- Respuesta `400` si el archivo es inválido.

## 7. Esquema de base de datos

### Tablas principales

Definidas en [supabase/migrations/001_init_schema_and_seed.sql](./supabase/migrations/001_init_schema_and_seed.sql):

- `companies`
- `profiles`
- `customers`
- `payment_methods`
- `cash_sessions`
- `cash_events`
- `transactions`
- `transaction_payments`
- `cash_movements`
- `audit_logs`

### Relaciones clave

- `profiles.id` referencia `auth.users.id`.
- `transactions.company_id` referencia `companies.id`.
- `transactions.customer_id` referencia `customers.id`.
- `transactions.cash_session_id` referencia `cash_sessions.id`.
- `transaction_payments.transaction_id` referencia `transactions.id`.
- `transaction_payments.payment_method_id` referencia `payment_methods.id`.
- `cash_movements.cash_session_id` referencia `cash_sessions.id`.
- `cash_events.cash_session_id` referencia `cash_sessions.id`.

### Reglas de negocio en columnas

- `profiles.role` solo admite `admin` o `cashier`.
- `cash_sessions.status` solo admite `open` o `closed`.
- `transactions.transaction_type` solo admite `sale`, `cash_delivery`, `manual_adjustment`, `refund`.
- `transactions.status` solo admite `confirmed` o `cancelled`.
- `cash_movements.movement_type` restringe los tipos operativos.

### Índices

La migración base crea índices para:

- fecha de transacciones
- empresa + fecha
- cliente
- número de documento
- tipo y estado de transacción
- pagos por transacción
- pagos por método
- movimientos de caja por sesión y fecha
- auditoría por entidad

La migración [002_search_indexes_and_db_invariants.sql](./supabase/migrations/002_search_indexes_and_db_invariants.sql) agrega además:

- `pg_trgm`
- índices trigram para búsqueda parcial en clientes y documentos

## 8. RLS y permisos

### Activación

La migración [004_enforce_rls_and_cash_permissions.sql](./supabase/migrations/004_enforce_rls_and_cash_permissions.sql) activa y fuerza RLS en:

- `profiles`
- `companies`
- `customers`
- `payment_methods`
- `cash_sessions`
- `cash_events`
- `transactions`
- `transaction_payments`
- `cash_movements`
- `audit_logs`

### Funciones auxiliares

- `public.current_user_role()`
- `public.is_active_role(expected_role text)`

### Políticas relevantes

- `profiles`: el usuario solo lee su propio perfil.
- `companies`, `customers`, `payment_methods`: lectura para `admin` y `cashier` activos.
- `cash_sessions`: lectura para `admin` y `cashier`; inserción y update solo admin.
- `transactions`: lectura para ambos roles; inserción para roles activos sobre ventas confirmadas; update/delete solo admin.
- `transaction_payments`: lectura para ambos roles; inserción para usuarios activos; update/delete solo admin.
- `cash_movements`: lectura para ambos roles; inserción para usuarios activos; update/delete solo admin.
- `audit_logs`: lectura para ambos roles; inserción para usuarios activos; update/delete solo admin.

## 9. Invariantes importantes

### Ventas

La migración [002_search_indexes_and_db_invariants.sql](./supabase/migrations/002_search_indexes_and_db_invariants.sql) define un trigger que exige:

- `created_by` debe coincidir con el usuario autenticado.
- solo se insertan ventas `sale` y `confirmed`.
- si la venta se asocia a `cash_session_id`, la caja debe estar abierta.
- la fecha de la venta debe coincidir con la fecha de la caja.

### Movimientos de caja

El mismo archivo define otro trigger que exige:

- `created_by` debe coincidir con el usuario autenticado.
- solo se insertan movimientos en sesiones abiertas.
- la fecha del movimiento debe coincidir con la sesión.
- cambios en movimientos de caja cerrados solo los puede hacer admin.
- cualquier update/delete genera registro en `audit_logs`.

## 10. Cómo se llama el sistema desde el frontend

### Login

- UI: `POST /api/auth/login`
- luego: `GET /api/auth/session`
- fallback: redirect automático según rol

### Catálogos

- `fetch("/api/bff/companies")`
- `fetch("/api/bff/payment-methods")`
- `fetch("/api/bff/customers?search=...")`

### Caja

- `fetch("/api/bff/cash/today?session_date=YYYY-MM-DD")`
- `fetch("/api/bff/cash/history")`
- `fetch("/api/bff/cash/events")`

### Ventas

- `fetch("/api/bff/sales")`
- `fetch("/api/bff/sales/{id}")`

### Dashboard

- `fetch("/api/bff/dashboard")`

### Migración histórica

- `POST /api/bff/admin/historic-migration`

## 11. Respuestas esperadas más usadas

### Salud

```json
{"status":"ok"}
```

### Sesión autenticada

```json
{
  "authenticated": true,
  "userId": "uuid",
  "username": "Nombre",
  "role": "admin"
}
```

### Errores estándar

El backend devuelve errores con esta forma:

```json
{"detail":"mensaje"}
```

## 12. Observaciones operativas

- `backend/src/db/init_db.py` no construye el esquema. Solo mantiene compatibilidad local.
- El esquema real vive en Supabase y se gobierna por migraciones SQL.
- En el frontend hay secretos sensibles en `.env.local`; no deben copiarse al repo.
- Los endpoints del frontend en `/api/bff/*` son una capa de proxy, no el negocio real.

## 13. Archivos más importantes para mantenimiento

- [backend/src/api/main.py](./backend/src/api/main.py)
- [backend/src/core/config.py](./backend/src/core/config.py)
- [backend/src/api/routes/sales.py](./backend/src/api/routes/sales.py)
- [backend/src/api/routes/cash.py](./backend/src/api/routes/cash.py)
- [backend/src/api/routes/dashboard.py](./backend/src/api/routes/dashboard.py)
- [backend/src/api/routes/historic_migration.py](./backend/src/api/routes/historic_migration.py)
- [web/app/api/auth/login/route.ts](./web/app/api/auth/login/route.ts)
- [web/app/api/auth/session/route.ts](./web/app/api/auth/session/route.ts)
- [web/app/api/bff/sales/route.ts](./web/app/api/bff/sales/route.ts)
- [web/app/api/bff/dashboard/route.ts](./web/app/api/bff/dashboard/route.ts)
- [web/proxy.ts](./web/proxy.ts)
- [supabase/migrations/001_init_schema_and_seed.sql](./supabase/migrations/001_init_schema_and_seed.sql)
- [supabase/migrations/002_search_indexes_and_db_invariants.sql](./supabase/migrations/002_search_indexes_and_db_invariants.sql)
- [supabase/migrations/004_enforce_rls_and_cash_permissions.sql](./supabase/migrations/004_enforce_rls_and_cash_permissions.sql)


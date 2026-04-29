# Standalone de estado (Proyecto LATAS)

## Objetivo acordado
Migración **Fase 1 híbrida**:
- Frontend principal en **Next.js**.
- Backend **FastAPI** se mantiene temporalmente.
- BD en **Supabase Postgres**.
- Deploy en **Vercel** con acceso controlado.
- **Resend omitido por ahora**.
- No hay datos actuales para migrar.

## Cambios implementados en repo
- Nuevo frontend Next.js en `web/`:
  - `web/app/*` páginas base (`/`, `/ventas`, `/reportes`, `/login`)
  - BFF routes:
    - `web/app/api/bff/dashboard/route.ts`
    - `web/app/api/bff/ventas/route.ts`
  - Auth UI básica:
    - `web/app/api/auth/login/route.ts`
    - `web/middleware.ts`
  - Config y base:
    - `web/package.json`
    - `web/tsconfig.json`
    - `web/next.config.ts`
    - `web/.env.example`
- Build validado:
  - `npm install` y `npm run build` en `web/` **exitosos**.
- Supabase:
  - Esquema creado en `supabase/schema.sql`
  - **Schema aplicado** en tu proyecto Supabase por pooler.
- Backend hardening:
  - `backend/src/core/config.py` (secretos y CORS por env)
  - `backend/src/api/main.py` (validación de secretos obligatorios + CORS configurable)
  - `backend/.env.example` actualizado con dominio Vercel:
    - `https://projectlatas.vercel.app`
- Migración SQLite->Supabase:
  - Script: `backend/scripts/migrate_sqlite_to_supabase.py`
  - Dependencia actualizada a `psycopg[binary]==3.2.13`.

## Estado de datos
- Confirmado: no hay datos fuente en SQLite actualmente.
- `backend/ventas.db` y `ventas.db` están vacías (sin tablas útiles).
- Migración de datos queda pendiente hasta que exista archivo fuente con datos.

## Credenciales/contexto ya definidos
- Vercel domain: `projectlatas.vercel.app`
- Supabase project URL: `https://osfindxdpkfxhnfcahiy.supabase.co`
- DSN pooler usado:
  - `postgresql://postgres.osfindxdpkfxhnfcahiy:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:6543/postgres`

## Próximos pasos recomendados (nuevo chat)
1. Conectar `web/` como proyecto en Vercel y cargar env vars.
2. Definir estrategia de auth productiva (reemplazar password simple actual).
3. Integrar cliente Supabase en Next.js (lectura/escritura real desde BFF).
4. Ajustar CORS/env finales en backend productivo.
5. (Cuando haya datos) ejecutar migración SQLite->Supabase y validar conteos/sumas.

---

## Continuación (2026-04-29)

### Estado actual confirmado en repositorio
- `CHAT_STANDALONE.md` sigue **sin commit** (archivo nuevo en working tree).
- También están sin commit los cambios de Fase 1 en:
  - `web/`
  - `supabase/`
  - `docs/migration-phase1.md`
  - `backend/scripts/migrate_sqlite_to_supabase.py`
  - ajustes en `backend/src/api/main.py`, `backend/src/core/config.py`, `backend/requirements.txt`, `README.md`

### Alineación con plan/arquitectura
- El plan histórico en `specs/009-infraestructura-docker/plan.md` describe stack local con `frontend/` (React/Vite) + `backend/` + `nginx`.
- La Fase 1 actual agrega un nuevo frontend en `web/` (Next.js) orientado a Vercel.
- Conclusión operativa: convivimos temporalmente con dos frentes (`frontend/` legado local y `web/` nuevo), priorizando `web/` para despliegue cloud.

### Punto de atención
- En este standalone se acordó "Resend omitido por ahora".
- `docs/migration-phase1.md` todavía documenta variables/cron de Resend.
- Recomendación: decidir una sola versión oficial y unificar documentación para evitar configuración innecesaria.

### Siguiente bloque de ejecución sugerido
1. Commit de baseline Fase 1 (incluyendo este standalone) para congelar estado.
2. Configurar proyecto `web/` en Vercel con `BACKEND_API_URL`, `SESSION_SECRET`, `ADMIN_UI_PASSWORD`.
3. Verificar login + páginas protegidas + BFF (`/api/bff/dashboard`, `/api/bff/ventas`) en preview deployment.
4. Definir si Resend entra en Fase 1 o se mueve a Fase 2; actualizar `docs/migration-phase1.md` según decisión.

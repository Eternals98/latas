# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LATAS is a monorepo implementing a sales, cash management, and reporting system with:
- Frontend: Next.js 16 (TypeScript) on Vercel
- Backend: FastAPI (Python) on Render  
- Database: PostgreSQL via Supabase with RLS policies
- Purpose: Replaces Excel-based sales ledger with modern web app for sales registration, cash control, and analytics

## Architecture

### Tech Stack
- Frontend: Next.js 16 with App Router, React 19, Tailwind CSS, Recharts
- Backend: FastAPI with SQLAlchemy 2 ORM, Pydantic validation
- Auth: Supabase Auth with JWT validation, session cookies (HTTP-only)
- Database: Postgres with versioned migrations in supabase/migrations/

### Key Design Decisions

1. **Backend Required for Financial Operations**: All money-affecting operations (sales, cash movements, audits) must go through FastAPI backend, never directly to database. Frontend uses BFF layer at web/app/api/bff/* as proxy.

2. **RLS (Row Level Security)**: Supabase RLS policies enforce data isolation per company/user. Backend validates JWT from Supabase Auth in require_user() / require_admin() dependency injection.

3. **Data Flow**: Frontend (Next.js) -> BFF Routes -> FastAPI Backend -> SQLAlchemy ORM -> Supabase Postgres

4. **User/Profile Sync**: public.profiles table synced from auth.users via migration 003. Roles: admin, cashier.

### Directory Structure

backend/src/api/ contains routes (sales, cash, customers, dashboard, etc.) and schemas (Pydantic models)
backend/src/models/ contains SQLAlchemy ORM models for transactions, payments, cash, etc.
backend/src/services/ contains business logic (sales_service, cash_service, dashboard_service, etc.)
backend/src/core/ contains config loading from .env
backend/src/db/ contains session management

web/app/api/auth/* contains login, logout, session endpoints
web/app/api/bff/* contains proxy routes to backend
web/app/ contains protected pages (dashboard, salesRegister, cash-management, reportes, etc.)
web/lib/ contains utilities (auth, session, backend client, supabase client)
web/components/ contains reusable UI components

supabase/migrations/ contains versioned SQL files for schema evolution
supabase/config.toml contains local Supabase project configuration

## Build and Development Commands

Windows convenience scripts (waits for backend before starting frontend):
  .\start-backend.ps1     # Starts FastAPI with .venv auto-detect
  .\start-frontend.ps1    # Waits for backend on :8000, then starts Next.js

Backend Setup:
  cd backend
  python -m venv .venv
  # Windows: .\.venv\Scripts\Activate.ps1
  # Unix: source .venv/bin/activate
  pip install -r requirements.txt

Backend Development:
  # Start FastAPI dev server (auto-reload)
  cd backend
  uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

  # Run all tests
  pytest

  # Run unit tests verbose
  pytest -xvs tests/unit/

  # Run integration tests
  pytest -xvs tests/integration/

  # Run specific test
  pytest -xvs -k test_sales_api

Frontend Setup:
  cd web
  npm install

Frontend Development:
  cd web
  npm run dev          # Dev server on localhost:3000
  npm run build        # Production build
  npm run lint         # TypeScript/ESLint checks
  npm start            # Production server

Database:
  cd backend
  python -m src.db.init_db
  python scripts/check_schema.py

## Environment Variables

Backend (backend/.env):
  APP_ENV, APP_HOST, APP_PORT
  DATABASE_URL (SQLite local or Postgres)
  CORS_ORIGINS (comma-separated list)
  SUPABASE_URL, SUPABASE_JWKS_URL, SUPABASE_JWT_ISSUER
  SUPABASE_JWT_AUDIENCE=authenticated
  SUPABASE_JWKS_CACHE_TTL_SECONDS=300
  SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY

Frontend (web/.env.local):
  BACKEND_API_URL=http://localhost:8000
  SUPABASE_URL, SUPABASE_ANON_KEY

## Key APIs and Workflows

Sales Registration (Primary Feature):
  1. User selects company and type (formal/informal)
  2. Enters reference, description, total value
  3. Searches customer via autocomplete (/api/customers?search=)
  4. Selects payment methods from catalog (/api/payment-methods)
  5. Frontend validates payment sum equals total
  6. POST /api/sales creates transaction + payments atomically
  7. Response includes sale ID and timestamp

Cash Management:
  POST /api/cash/open - start cash session
  POST /api/cash/delivery - record vault delivery
  POST /api/cash/vault-withdrawal - withdraw from vault
  POST /api/cash/adjustment - manual adjustment
  POST /api/cash/close - end session
  GET /api/cash/today - current session state
  GET /api/cash/history - historical movements

Dashboard (Admin):
  GET /api/dashboard returns aggregated metrics:
  - sales by month, by method, by company
  - average ticket, total sales
  - only includes estado=activo sales
  - decimals as strings with 2 places

Data Export:
  GET /api/ventas/export?tipo=formal&mes=4&anio=2026
  Returns XLSX file filtered by type and date range

Historic Migration (Admin only):
  POST /api/admin/historic-migration (multipart: file=.xlsx, month=optional)
  Imports legacy Excel data into transactions table; requires admin JWT

## Important Code Patterns

Backend Dependency Injection:
  @router.post("/api/sales")
  def create_sale(
      payload: SaleCreateRequest,
      actor: Profile = Depends(require_user),  # JWT validation
      db: Session = Depends(get_db),            # SQLAlchemy session
  ):

Error Handling:
  Custom exceptions: SalesValidationError, SalesConflictError, SalesNotFoundError
  Map to HTTP codes: 400, 409, 404, 403
  Response includes ErrorResponse with detail field

Frontend Session Management:
  HTTP-only cookies set by /api/auth/login
  getSessionUser() reads cookie server-side
  proxy.ts protects private routes
  Role-based redirects: admin -> dashboard, cashier -> salesRegister

Payment Validation:
  Backend enforces: sum of payment amounts must equal total
  No partial payments allowed
  Multiple payment methods per sale allowed

## Testing

Unit Tests (backend/tests/unit/):
  - test_admin_auth.py: JWT generation and validation
  - test_cash_service.py: Cash movement logic
  - test_supabase_auth_jwt.py: Supabase JWT verification

Integration Tests (backend/tests/integration/):
  - test_health.py: Health endpoint
  - test_sales_api.py: Full sales creation flow
  - test_cash_api.py: Cash operation endpoints
  - test_cors.py: CORS headers

Contract Tests (backend/tests/contract/): reserved for API contract tests

Test Fixtures (backend/tests/conftest.py):
  - Test database session
  - FastAPI test client
  - Sample companies, customers, payment methods

Running Specific Tests:
  pytest -xvs tests/unit/test_cash_service.py::test_cash_opening
  pytest -xvs tests/integration/test_sales_api.py -k "test_create_sale"

## Database Schema

Core Tables:
  companies - organizational units
  profiles - users synced from auth.users with role (admin/cashier)
  transactions - sales records with status (activo/anulado)
  transaction_payments - payment breakdown per sale
  payment_methods - catalog of payment types
  customers - client records
  cash_sessions - daily cash operation logs
  cash_movements - cash in/out/adjustment records
  audit_logs - all data changes for compliance

RLS Policies:
  profiles: visible only to own user
  transactions: visible by company and role
  cash_sessions: restricted to managers
  Enforced at Postgres level before data is returned

## Common Development Tasks

Adding a New Sales Field:
  1. Create migration adding column to transactions table
  2. Update Transaction model in backend/src/models/transaction.py
  3. Update SaleCreateRequest and SaleResponse schemas
  4. Modify create_sale() in backend/src/services/sales_service.py
  5. Update frontend form in web/app/salesRegister/page.tsx
  6. Add test case in backend/tests/integration/test_sales_api.py

Adding a New Report:
  1. Create aggregation logic in dashboard_service.py or new service
  2. Add route in backend/src/api/routes/dashboard.py
  3. Add Pydantic schema in backend/src/api/schemas/
  4. Create page component in web/app/reportes/
  5. Optional: add BFF route for data privacy

Modifying Authentication:
  JWT validation: backend/src/services/supabase_auth.py
  Session cookies: web/lib/auth.ts and web/app/api/auth/*
  Role logic: require_admin() function
  Profile sync: migration 003

## Phase Status

Phase 1 (Complete):
  Database schema with core tables, Supabase Auth integration, health checks

Phase 2 (Active):
  Sales registration flow, dashboard analytics, XLSX export, legacy endpoints

Phase 3 (In Progress):
  Cash management endpoints, session lifecycle, audit trail

Future:
  Background jobs, automated reconciliation, multi-company rollups, forecasting

## Performance Notes

Dashboard queries aggregate on-demand (no materialized views yet)
Payment methods cached in frontend per form (refresh on load)
XLSX export streams to avoid memory issues
JWT JWKS cached locally for 300s to reduce auth calls

## Deployment

Frontend: Vercel with Next.js 16 (auto-deploy on push to main)
Backend: Render with Python 3.x runtime and Gunicorn
Database: Supabase (managed, auto-backups, point-in-time recovery)

Ensure environment variables match production Supabase project before deploying.

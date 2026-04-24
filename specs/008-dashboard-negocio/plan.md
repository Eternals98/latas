# Implementation Plan: Dashboard de Negocio

**Branch**: `008-dashboard-negocio` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-dashboard-negocio/spec.md`

## Summary

Implementar una subfuncion de dashboard dentro de `Reportes` con indicadores de ventas
activas: ventas por mes, ventas por empresa, distribucion por metodo de pago, total del
mes actual y ticket promedio. La entrega agrega `GET /api/dashboard` como lectura
agregada del backend, reutiliza `Venta`, `Cliente` y `Pago`, y expone visualizaciones
en frontend con Recharts sin introducir nuevos modelos persistentes ni analitica avanzada.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript + React 19 (frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Pydantic, React, Vite, Tailwind CSS, Recharts  
**Storage**: SQLite local (`ventas.db`) con consultas SQLAlchemy compatibles con PostgreSQL  
**Testing**: pytest (unit, integration, contract) + build/lint frontend para UI del dashboard  
**Target Platform**: Aplicacion web local en LAN, navegador de escritorio y backend offline-capable  
**Project Type**: Web application (backend API + frontend SPA)  
**Performance Goals**: Dashboard visible en < 3 s para volumen operativo normal; calculos agregados en < 2 s local  
**Constraints**: solo ventas activas en indicadores, backend como fuente de verdad, sin dependencia cloud, sin filtros avanzados en v1  
**Scale/Scope**: Fase 4 (Dashboard), 2 operadores concurrentes, ventas diarias en base SQLite local

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Design Gate:
- Simplicity gate: PASS. Se agrega una lectura agregada y una pantalla consumidora, sin servicios nuevos ni persistencia adicional.
- Domain gate: PASS. El diseno usa `Venta`, `Cliente` y `Pago` como fuentes directas del dashboard.
- Backend-truth gate: PASS. Totales, ticket promedio, exclusion de anuladas y agrupaciones quedan en backend.
- Persistence gate: PASS. Las agregaciones se pueden expresar con SQLAlchemy y son compatibles con SQLite/PostgreSQL.
- Security gate: PASS. No introduce OAuth ni nuevas operaciones admin; es lectura operativa local.
- Modularity gate: PASS. Impacto acotado a `Reportes` como subfuncion de dashboard, con Ventas/Pagos como fuentes y frontend consumidor.
- UX productivity gate: PASS. La pantalla reduce consolidacion manual y permite lectura rapida.
- AI decoupling gate: PASS. Sin dependencia de `/api/analisis`.
- Export gate: PASS. No modifica exportaciones formal/informal existentes.
- Deploy gate: PASS. Funciona en LAN/offline y Docker Compose con dependencias locales.
- Traceability gate: PASS. Indicadores conservan dimensiones rastreables: mes, empresa y metodo de pago.
- Evolution gate: PASS. Corresponde a fase 4; IA, predicciones, alertas y filtros avanzados quedan fuera.

Post-Design Gate (re-check):
- Simplicity gate: PASS. Contrato limitado a `GET /api/dashboard`; DTOs agregados sin tablas nuevas.
- Domain gate: PASS. Data model documenta vistas agregadas sobre `Venta`, `Cliente/Empresa` y `Pago`.
- Backend-truth gate: PASS. OpenAPI centraliza respuesta calculada y evita calculos divergentes en frontend.
- Persistence gate: PASS. Reglas de agregacion usan rangos/agrupaciones portables y decimales serializados.
- Security gate: PASS. Dashboard no cambia autenticacion; queda dentro del uso operativo local existente.
- Modularity gate: PASS. Cambios previstos en rutas/schemas/servicio de dashboard bajo responsabilidad funcional de `Reportes` y cliente/pagina frontend.
- UX productivity gate: PASS. Quickstart valida una consulta y visualizacion directa.
- AI decoupling gate: PASS. No se toca `/api/analisis`.
- Export gate: PASS. Reportes/exportaciones existentes siguen siendo independientes.
- Deploy gate: PASS. Guia local usa backend/frontend existentes sin servicios cloud.
- Traceability gate: PASS. Contrato incluye dimensiones y totales suficientes para comparar con reportes.
- Evolution gate: PASS. No incluye filtros avanzados, objetivos comerciales ni predicciones.

## Project Structure

### Documentation (this feature)

```text
specs/008-dashboard-negocio/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── requirements.txt                  # sin cambios esperados para backend
├── src/
│   ├── api/
│   │   ├── main.py                   # incluir router de /api/dashboard
│   │   ├── routes/
│   │   │   └── dashboard.py          # GET /api/dashboard
│   │   └── schemas/
│   │       └── dashboard.py          # DTOs agregados del dashboard
│   ├── services/
│   │   └── dashboard_service.py      # consultas y calculos agregados
│   └── models/
│       ├── venta.py
│       ├── pago.py
│       └── cliente.py
└── tests/
    ├── contract/
    │   └── test_dashboard_contract.py
    ├── integration/
    │   └── test_dashboard_api.py
    └── unit/
        └── test_dashboard_service.py

frontend/
├── package.json                      # agregar Recharts
├── src/
│   ├── pages/
│   │   └── DashboardPage.tsx
│   ├── services/
│   │   └── dashboardApi.ts
│   └── types/
│       └── dashboard.ts
└── tests/
    └── unit/
```

**Structure Decision**: Web application modular existente. Se agrega una subfuncion de
dashboard dentro de `Reportes` para lectura agregada y UI, reutilizando entidades de
ventas y pagos. Los archivos pueden llamarse `dashboard` por endpoint/pantalla, pero la
responsabilidad funcional permanece en `Reportes`. No se agregan tablas, colas, cache
distribuido ni servicios externos.

## Complexity Tracking

No constitutional violations identified in planning or design.

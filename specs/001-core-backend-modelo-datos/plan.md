# Implementation Plan: Core Backend y Modelo de Datos

**Branch**: `001-core-backend-modelo-datos` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-core-backend-modelo-datos/spec.md`

## Summary

Inicializar la base del backend del sistema de ventas con arquitectura modular monolítica,
persistencia relacional local y modelos de dominio `Cliente`, `Venta`, `Pago`, incluyendo
relaciones estructurales y endpoint de salud `/api/health`. En esta fase no se implementan
reglas de negocio de conciliación ni autenticación de usuarios normales.

## Technical Context

**Language/Version**: Python 3.12  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Uvicorn, Pydantic Settings  
**Storage**: SQLite (archivo local) con diseño compatible para migración a PostgreSQL  
**Testing**: pytest (smoke de health + validaciones estructurales de modelo/relaciones)  
**Target Platform**: LAN local en Windows/Linux con ejecución offline  
**Project Type**: Web application (backend API + frontend desacoplado)  
**Performance Goals**: Health check estable en entorno local y arranque del servicio < 10 min para el equipo  
**Constraints**: local-first, sin cloud obligatorio, sin lógica de negocio avanzada en esta fase, base Docker Compose sin despliegue full  
**Scale/Scope**: 2 equipos en red local, Fase 1 (Registro + DB) únicamente

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Simplicity gate: PASS. Se adopta monolito modular con capas mínimas (`api`, `models`, `db`).
- Domain gate: PASS. Modelo explícito `Venta`-`Pago` (1:N) y `Cliente` opcional en `Venta`.
- Backend-truth gate: PASS. Todo contrato y futuras reglas críticas se reservan al backend.
- Persistence gate: PASS. SQLAlchemy 2.x con tipos y convenciones compatibles con PostgreSQL.
- Security gate: PASS. No OAuth ni auth global en esta fase; admin JWT diferido a fase posterior.
- Modularity gate: PASS. Impacta módulos Ventas/Clientes y habilita Reportes/Admin.
- UX productivity gate: PASS. Se habilita base de datos/contratos para UX rápida en frontend posterior.
- AI decoupling gate: PASS. Sin integración IA en este alcance.
- Export gate: PASS. Estructura deja trazabilidad y tipado para exportaciones formal/informal futuras.
- Deploy gate: PASS. Diseño local-first y operativo offline.
- Traceability gate: PASS. `creado_en`, `modificado_en`, `estado` definidos en modelo transaccional.
- Evolution gate: PASS. Alcance restringido a Fase 1.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-backend-modelo-datos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── implementation-guardrails.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   └── health.py
│   │   ├── schemas/
│   │   │   └── health.py
│   │   └── main.py
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── init_db.py
│   ├── models/
│   │   ├── cliente.py
│   │   ├── venta.py
│   │   └── pago.py
│   └── core/
│       └── config.py
└── tests/
    ├── integration/
    └── unit/

frontend/
└── (fuera de alcance en este feature)

docker-compose.yml
backend/Dockerfile
```

**Structure Decision**: Se selecciona estructura web app con foco en `backend/` para respetar
modularidad funcional y mantener simplicidad operacional en fase inicial.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitutional violations identified in planning or design.

# Implementation Plan: Reportes de Ventas

**Branch**: `006-reportes-ventas` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-reportes-ventas/spec.md`

## Summary

Implementar consulta mensual de ventas y exportacion simple a hoja de calculo separada por tipo
formal/informal. La entrega extiende el modulo `Ventas` con lectura filtrada por mes/anio,
agrupacion mensual basica y descarga de archivo compatible con el formato Excel actual,
manteniendo el backend como fuente de verdad y reutilizando modelos `Venta`, `Cliente` y `Pago`.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript + React 19 (frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Pydantic, openpyxl para XLSX, React, Vite, Tailwind CSS  
**Storage**: SQLite local (`ventas.db`) con consultas SQLAlchemy compatibles con PostgreSQL  
**Testing**: pytest (unit, integration, contract) + build/lint frontend cuando haya UI consumidora  
**Target Platform**: Aplicacion web local en LAN, navegador de escritorio y backend offline-capable  
**Project Type**: Web application (backend API + frontend SPA)  
**Performance Goals**: Consulta mensual en < 10 s para periodos operativos normales; exportacion mensual en < 15 s  
**Constraints**: formato XLSX simple, separacion formal/informal obligatoria, solo ventas activas en reportes operativos, sin dependencia cloud, reglas en backend  
**Scale/Scope**: Fase 2 (Reportes + exportacion), 2 operadores concurrentes, ventas diarias en base SQLite local

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Design Gate:
- Simplicity gate: PASS. Se agregan funciones de consulta/exportacion al modulo existente, sin servicios nuevos.
- Domain gate: PASS. El diseno parte de `Venta`, `Cliente` y `Pago` con relaciones existentes.
- Backend-truth gate: PASS. Filtros, validacion de periodo/tipo y armado de exportacion quedan en backend.
- Persistence gate: PASS. Se usan consultas SQLAlchemy y campos existentes, compatibles con SQLite/PostgreSQL.
- Security gate: PASS. No se introduce OAuth ni autenticacion externa; reportes/exportacion quedan como flujo operativo local autorizado, no como funcion admin de edicion/configuracion.
- Modularity gate: PASS. Impacto acotado a Ventas/Reportes y cliente HTTP frontend.
- UX productivity gate: PASS. Consulta por periodo y descarga directa reducen pasos manuales.
- AI decoupling gate: PASS. Sin cambios ni dependencia de `/api/analisis`.
- Export gate: PASS. Exportacion formal/informal es el objetivo central y se mantiene separada.
- Deploy gate: PASS. Funciona en Docker Compose y LAN/offline con dependencia local instalada.
- Traceability gate: PASS. Resultados y archivos incluyen identificadores, fechas y totales de venta.
- Evolution gate: PASS. Formato elaborado, dashboard y analitica avanzada quedan fuera de esta fase.

Post-Design Gate (re-check):
- Simplicity gate: PASS. Contratos limitados a `GET /api/ventas` y `GET /api/ventas/export`.
- Domain gate: PASS. Data model no agrega tablas; define DTOs de reporte sobre entidades existentes.
- Backend-truth gate: PASS. Validaciones de mes/anio/tipo se documentan en contrato y servicio.
- Persistence gate: PASS. Filtro por rango de fechas evita funciones SQL especificas de un motor.
- Security gate: PASS. No cambia la superficie de autenticacion; exportacion se mantiene local-first y no requiere elevar a flujo admin en esta fase.
- Modularity gate: PASS. Cambios previstos en `ventas.py`, `ventas_service.py`, schemas y cliente frontend.
- UX productivity gate: PASS. Quickstart valida flujo de consulta y descarga en pocos comandos.
- AI decoupling gate: PASS. Reportes base no dependen de IA.
- Export gate: PASS. OpenAPI define respuestas XLSX por formal/informal.
- Deploy gate: PASS. Guia local usa backend existente y Docker Compose opcional.
- Traceability gate: PASS. Contrato incluye `id`, fechas, referencia, cliente y pagos.
- Evolution gate: PASS. No se incorporan graficas, formulas complejas ni redisenos de Excel.

## Project Structure

### Documentation (this feature)

```text
specs/006-reportes-ventas/
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
├── requirements.txt                  # agregar dependencia XLSX si falta
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   └── ventas.py             # GET lista mensual y GET export
│   │   └── schemas/
│   │       └── ventas.py             # respuestas de lista/reporte/export errors
│   ├── services/
│   │   └── ventas_service.py         # filtros, agrupacion y generacion XLSX
│   └── models/
│       ├── venta.py
│       ├── pago.py
│       └── cliente.py
└── tests/
    ├── contract/
    │   └── test_ventas_reportes_contract.py
    ├── integration/
    │   └── test_ventas_reportes.py
    └── unit/
        └── test_ventas_reportes_service.py

frontend/
├── src/
│   ├── services/
│   │   └── ventasApi.ts              # listVentas/exportVentas
│   └── types/
│       └── venta.ts                  # tipos de reporte y filtros
└── tests/
    └── unit/
```

**Structure Decision**: Web application modular existente. Se extiende el modulo `Ventas`
en backend para reportes/exportacion y se prepara el cliente frontend para consumir los
contratos, sin crear un modulo fisico separado ni cambiar modelos persistentes.

## Complexity Tracking

No constitutional violations identified in planning or design.

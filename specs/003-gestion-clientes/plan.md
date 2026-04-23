# Implementation Plan: Gestion de Clientes

**Branch**: `003-gestion-clientes` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-gestion-clientes/spec.md`

## Summary

Implementar gestion de clientes enfocada en productividad operativa: busqueda por coincidencia parcial para autocompletado (`top 10`) con orden deterministico, creacion de cliente y bloqueo de duplicados exactos por nombre normalizado. La solucion mantiene backend como fuente de verdad, refuerza trazabilidad minima del modelo `Cliente` y agrega contrato API, reglas de validacion y guia de verificacion manual con control de rendimiento de busqueda.

## Technical Context

**Language/Version**: Python 3.12  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Uvicorn, Pydantic Settings  
**Storage**: SQLite local (`ventas.db`) con diseno compatible para migracion a PostgreSQL  
**Testing**: pytest (unit + integration + contract)  
**Target Platform**: Backend LAN local en Windows/Linux, operacion offline  
**Project Type**: Web application (backend API, frontend fuera de alcance)  
**Performance Goals**: Respuesta de busqueda de clientes en < 1 s en entorno local para autocomplete (`top 10`)  
**Constraints**: evitar duplicados exactos, permitir coincidencias parciales, orden de resultados deterministico, trazabilidad minima de `Cliente`, sin sobrealcance a edicion/eliminacion de clientes en esta fase  
**Scale/Scope**: Fase activa de consolidacion transaccional, 2 operadores en red local, foco en busqueda+alta de clientes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Design Gate:
- Simplicity gate: PASS. Se agrega solo flujo de busqueda/creacion sin capas nuevas.
- Domain gate: PASS. Se trabaja sobre `Cliente` y relacion operativa con `Venta`.
- Backend-truth gate: PASS. Duplicado exacto y normalizacion quedan en backend.
- Persistence gate: PASS. SQLAlchemy y tipos existentes mantienen compatibilidad PostgreSQL.
- Security gate: PASS. No se amplian superficies de autenticacion.
- Modularity gate: PASS. Cambios concentrados en modulo `Clientes` y consumo desde `Ventas`.
- UX productivity gate: PASS. El `top 10` de busqueda se alinea con autocompletado rapido.
- AI decoupling gate: PASS. Sin cambios en `/api/analisis`.
- Export gate: PASS. La no-duplicidad mejora coherencia de datos para reportes/exportaciones futuras.
- Deploy gate: PASS. Flujo verificable localmente con `curl`.
- Traceability gate: PASS. Se explicita trazabilidad minima de `Cliente` con `creado_en`, `modificado_en` y estado logico.
- Evolution gate: PASS. Alcance estricto a fase actual, sin dashboard/reportes/IA.

Post-Design Gate (re-check):
- Simplicity gate: PASS. Contrato y diseno cubren solo endpoints de clientes requeridos.
- Domain gate: PASS. Reglas explicitas de busqueda parcial y unicidad exacta por nombre normalizado.
- Backend-truth gate: PASS. Validaciones centrales ubicadas en API/servicio backend.
- Persistence gate: PASS. Sin acople a SQLite en reglas; diseno portable a PostgreSQL.
- Security gate: PASS. Sin cambios de permisos ni autenticacion externa.
- Modularity gate: PASS. Cambios acotados a rutas/esquemas/servicio de `Clientes`.
- UX productivity gate: PASS. Quickstart valida experiencia esperada de autocompletado.
- AI decoupling gate: PASS. Ningun impacto sobre modulo de analisis.
- Export gate: PASS. Calidad de maestro de clientes mejora salidas de negocio.
- Deploy gate: PASS. Comandos de ejecucion y pruebas son local-first.
- Traceability gate: PASS. Entidad `Cliente` mantiene `creado_en`, `modificado_en` y estado logico consistente.
- Evolution gate: PASS. Sin sobrealcance a funcionalidades de fases posteriores.

## Project Structure

### Documentation (this feature)

```text
specs/003-gestion-clientes/
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
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── ventas.py
│   │   │   └── clientes.py          # nuevo en esta fase
│   │   ├── schemas/
│   │   │   ├── health.py
│   │   │   ├── ventas.py
│   │   │   └── clientes.py          # nuevo en esta fase
│   │   └── main.py                  # registra router de clientes
│   ├── services/
│   │   ├── ventas_service.py
│   │   └── clientes_service.py      # nuevo en esta fase
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── init_db.py
│   └── models/
│       ├── cliente.py
│       ├── venta.py
│       └── pago.py
└── tests/
    ├── integration/
    │   ├── test_clientes_api.py     # nuevo en esta fase
    │   └── test_clientes_performance.py # nuevo en esta fase
    ├── unit/
    │   └── test_clientes_service.py # nuevo en esta fase
    └── contract/
        └── test_clientes_contract.py # nuevo en esta fase

specs/003-gestion-clientes/contracts/openapi.yaml
```

**Structure Decision**: Se conserva arquitectura backend-first existente y se agrega el modulo `Clientes` con cambios minimos en rutas, schemas, servicio y pruebas, manteniendo coherencia con fase previa.

## Complexity Tracking

No constitutional violations identified in planning or design.

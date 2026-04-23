# Implementation Plan: Registro de Ventas API

**Branch**: `002-registro-ventas-api` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-registro-ventas-api/spec.md`

## Summary

Implementar el endpoint `POST /api/ventas` para registrar una venta con uno o multiples pagos,
validando obligatoriedad de campos, consistencia entre total y suma de pagos, y persistencia
atomica en una transaccion unica. La entrega mantiene el backend como fuente de verdad,
reutiliza el modelo de dominio existente (Venta/Pago/Cliente) y agrega contrato API,
pruebas y guia de validacion manual por curl.

## Technical Context

**Language/Version**: Python 3.12  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Uvicorn, Pydantic Settings  
**Storage**: SQLite local (`ventas.db`) con diseno compatible para migracion a PostgreSQL  
**Testing**: pytest (unit + integration + contract smoke)  
**Target Platform**: Backend LAN local en Windows/Linux, operacion offline  
**Project Type**: Web application (backend API, frontend fuera de alcance)  
**Performance Goals**: Respuesta de creacion valida en < 1 s en entorno local para payload con hasta 5 pagos  
**Constraints**: transaccion atomica obligatoria, sin logica de reportes/IA/admin en esta fase, local-first sin cloud obligatorio  
**Scale/Scope**: Fase 1 (Registro + DB), 2 operadores en red local, foco en flujo unico de registro

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Design Gate:
- Simplicity gate: PASS. Se mantiene monolito modular sin nuevos componentes.
- Domain gate: PASS. El alcance usa `Venta` y `Pago`; `Cliente` queda opcional via `cliente_id`.
- Backend-truth gate: PASS. Reglas de total y obligatoriedad se aplican en backend.
- Persistence gate: PASS. SQLAlchemy + tipos decimales compatibles con PostgreSQL.
- Security gate: PASS. No se agregan flujos de autenticacion externos.
- Modularity gate: PASS. Impacto principal en modulo Ventas con referencia opcional a Clientes.
- UX productivity gate: PASS. Se prioriza respuesta clara de errores para captura rapida.
- AI decoupling gate: PASS. Sin cambios ni dependencia de `/api/analisis`.
- Export gate: PASS. Se conserva consistencia de datos para exportaciones futuras.
- Deploy gate: PASS. Flujo verificable localmente con curl.
- Traceability gate: PASS. Venta mantiene timestamps/estado del modelo existente.
- Evolution gate: PASS. Alcance estricto de fase de registro.

Post-Design Gate (re-check):
- Simplicity gate: PASS. Contrato y diseno se limitan al endpoint requerido.
- Domain gate: PASS. Data model define claramente venta-pagos y opcionalidad de cliente.
- Backend-truth gate: PASS. Todas las validaciones criticas quedan en API/servicio backend.
- Persistence gate: PASS. Estrategia de transaccion unica y tipos persistentes sin acople a SQLite.
- Security gate: PASS. Sin ampliacion de superficie de seguridad.
- Modularity gate: PASS. Cambios concentrados en rutas/esquemas/servicio de Ventas.
- UX productivity gate: PASS. Quickstart incluye mensajes de error esperados para feedback rapido.
- AI decoupling gate: PASS. No se toca modulo de analisis.
- Export gate: PASS. Contrato asegura montos coherentes para posteriores exportaciones.
- Deploy gate: PASS. Quickstart local-first y comandos reproducibles.
- Traceability gate: PASS. No se eliminan campos de trazabilidad existentes.
- Evolution gate: PASS. Sin sobrealcance hacia fases 2-5.

## Project Structure

### Documentation (this feature)

```text
specs/002-registro-ventas-api/
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
│   │   │   └── ventas.py            # nuevo en esta fase
│   │   ├── schemas/
│   │   │   ├── health.py
│   │   │   └── ventas.py            # nuevo en esta fase
│   │   └── main.py                  # registra router de ventas
│   ├── services/
│   │   └── ventas_service.py        # nuevo en esta fase
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
    │   └── test_ventas_create.py    # nuevo en esta fase
    └── unit/
        └── test_ventas_validations.py # nuevo en esta fase

specs/002-registro-ventas-api/contracts/openapi.yaml
```

**Structure Decision**: Se selecciona estructura web app backend-first, reutilizando `backend/`
existente y agregando solo modulos minimos para el flujo de registro de ventas.

## Complexity Tracking

No constitutional violations identified in planning or design.

# Implementation Plan: Gestion de Formas de Pago

**Branch**: `004-gestion-formas-pago` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-gestion-formas-pago/spec.md`

## Summary

Centralizar el catalogo de medios de pago en backend y exponer `GET /api/medios-pago` para eliminar hardcodeo en frontend. La implementacion propone un modulo ligero `MediosPago` con entidad propia (`MedioPago`) y endpoint de consulta de solo lectura en esta fase, dejando preparado el dominio para CRUD futuro sin romper contratos de consumo.

## Technical Context

**Language/Version**: Python 3.12  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Uvicorn, Pydantic Settings  
**Storage**: SQLite local (`ventas.db`) con diseno portable a PostgreSQL  
**Testing**: pytest (unit + integration + contract)  
**Target Platform**: Backend LAN local en Windows/Linux con operacion offline  
**Project Type**: Web application (backend API, frontend fuera de alcance)  
**Performance Goals**: Respuesta de `GET /api/medios-pago` en < 1 s en entorno local para carga de selectores  
**Constraints**: No hardcodear lista en frontend, mantener orden deterministico, preservar compatibilidad con reglas existentes de ventas, dejar base para CRUD futuro sin implementarlo ahora  
**Scale/Scope**: Fase transaccional local para 2 operadores en red LAN; 10 medios iniciales y posibilidad de crecimiento controlado

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Design Gate:
- Simplicity gate: PASS. Se agrega un catalogo y endpoint de lectura sin sobrearquitectura.
- Domain gate: PASS. Se incorpora `MedioPago` y su relacion operativa con `Pago`/`Venta`.
- Backend-truth gate: PASS. El backend publica la lista oficial para consumo de UI.
- Persistence gate: PASS. Modelo SQLAlchemy compatible con SQLite/PostgreSQL.
- Security gate: PASS. No hay cambios de autenticacion ni privilegios.
- Modularity gate: PASS. Cambios acotados al modulo de catalogo de pagos y consumo desde ventas.
- UX productivity gate: PASS. El endpoint elimina friccion por listas desactualizadas en frontend.
- AI decoupling gate: PASS. Sin impacto sobre `/api/analisis`.
- Export gate: PASS. Catalogo consistente favorece coherencia en reportes financieros futuros.
- Deploy gate: PASS. Flujo 100% local-first y compatible con Docker Compose.
- Traceability gate: PASS. `MedioPago` mantiene trazabilidad minima (`creado_en`, `modificado_en`, `activo`).
- Evolution gate: PASS. Alcance limitado a lectura del catalogo; CRUD queda explicitamente fuera.

Post-Design Gate (re-check):
- Simplicity gate: PASS. Se conserva implementacion minima de listado sin operaciones administrativas.
- Domain gate: PASS. `MedioPago` define contrato estable para uso transaccional y evolucion futura.
- Backend-truth gate: PASS. El catalogo oficial se sirve desde API backend.
- Persistence gate: PASS. Estructura y tipos permanecen portables a PostgreSQL.
- Security gate: PASS. Sin ampliacion de superficie de seguridad.
- Modularity gate: PASS. Cambios circunscritos a modelos/rutas/schemas/servicios de pagos.
- UX productivity gate: PASS. Respuesta lista para poblar opciones de pago en frontend.
- AI decoupling gate: PASS. Feature sin dependencia de IA.
- Export gate: PASS. Homogeneiza nombres de medios para consolidacion posterior.
- Deploy gate: PASS. Verificable localmente con `curl` y stack actual.
- Traceability gate: PASS. Entidad incorpora timestamps y estado logico.
- Evolution gate: PASS. Contrato de lectura estable para fases futuras de CRUD.

## Project Structure

### Documentation (this feature)

```text
specs/004-gestion-formas-pago/
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
│   │   │   ├── clientes.py
│   │   │   └── medios_pago.py       # nuevo
│   │   ├── schemas/
│   │   │   ├── health.py
│   │   │   ├── ventas.py
│   │   │   ├── clientes.py
│   │   │   └── medios_pago.py       # nuevo
│   │   └── main.py                  # registra router de medios de pago
│   ├── services/
│   │   ├── ventas_service.py
│   │   ├── clientes_service.py
│   │   └── medios_pago_service.py   # nuevo
│   ├── models/
│   │   ├── venta.py
│   │   ├── pago.py
│   │   ├── cliente.py
│   │   └── medio_pago.py            # nuevo
│   └── db/
│       ├── base.py
│       ├── session.py
│       └── init_db.py
└── tests/
    ├── contract/
    │   └── test_medios_pago_contract.py     # nuevo
    ├── integration/
    │   └── test_medios_pago_api.py          # nuevo
    └── unit/
        └── test_medios_pago_service.py      # nuevo

specs/004-gestion-formas-pago/contracts/openapi.yaml
```

**Structure Decision**: Se mantiene arquitectura backend modular existente y se agrega `MediosPago` como modulo acotado (modelo + servicio + endpoint + pruebas), evitando cambios disruptivos en ventas mientras se habilita evolucion a CRUD en siguientes fases.

## Complexity Tracking

No constitutional violations identified in planning or design.

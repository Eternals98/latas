# Implementation Plan: Administracion de Ventas

**Branch**: `007-admin-ventas` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-admin-ventas/spec.md`

## Summary

Implementar administracion minima para editar y anular ventas existentes. La entrega agrega un
login administrativo con JWT temporal de 8 horas, protege `PUT /api/ventas/{id}` y
`DELETE /api/ventas/{id}`, reutiliza las validaciones de venta/pagos del modulo `Ventas` y
mantiene anulacion logica con `estado = anulado`, sin borrado fisico.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript + React 19 (frontend si se expone UI consumidora)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Pydantic, PyJWT para tokens JWT, React, Vite, Tailwind CSS  
**Storage**: SQLite local (`ventas.db`) con modelos SQLAlchemy compatibles con PostgreSQL  
**Testing**: pytest (unit, integration, contract) + build/lint frontend cuando haya UI consumidora  
**Target Platform**: Aplicacion web local en LAN, navegador de escritorio y backend offline-capable  
**Project Type**: Web application (backend API + frontend SPA)  
**Performance Goals**: Login admin en < 1 s local; edicion/anulacion de venta en < 2 s para volumen operativo normal  
**Constraints**: JWT admin temporal de 8 h, sin OAuth/proveedor externo, no borrar ventas fisicamente, reglas criticas en backend, reportes/exportaciones solo incluyen ventas activas  
**Scale/Scope**: Fase 3 (Admin + edicion), 2 operadores concurrentes, administracion local para correcciones operativas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Design Gate:
- Simplicity gate: PASS. Se agrega autenticacion admin minima y operaciones en modulo existente, sin microservicios ni gestion compleja de usuarios.
- Domain gate: PASS. El diseno se centra en `Venta`, `Cliente` y `Pago`; `Administrador` es identidad de acceso, no cambia el dominio transaccional base.
- Backend-truth gate: PASS. Autorizacion, validacion de datos, reglas de edicion, anulacion logica y exclusiones de reportes quedan en backend.
- Persistence gate: PASS. Se reutilizan modelos SQLAlchemy existentes y el campo `estado`; los cambios son compatibles con SQLite/PostgreSQL.
- Security gate: PASS. Admin requiere password y JWT temporal; no se introduce OAuth ni proveedor externo.
- Modularity gate: PASS. Impacto acotado a `Administracion` para login/JWT y `Ventas` para edicion/anulacion.
- UX productivity gate: PASS. Habilita correcciones sin edicion manual de DB ni ventas duplicadas.
- AI decoupling gate: PASS. No se toca `/api/analisis`.
- Export gate: PASS. Reportes/exportaciones existentes siguen filtrando ventas activas.
- Deploy gate: PASS. Funciona local/LAN/offline con secreto y credencial admin configurables.
- Traceability gate: PASS. `Venta` conserva `creado_en`, actualiza `modificado_en` y mantiene `estado` logico.
- Evolution gate: PASS. Corresponde a fase 3; dashboard, auditoria detallada y gestion de usuarios quedan fuera.

Post-Design Gate (re-check):
- Simplicity gate: PASS. Contratos limitados a `POST /api/admin/login`, `PUT /api/ventas/{id}` y `DELETE /api/ventas/{id}`.
- Domain gate: PASS. Data model extiende reglas de `Venta` y `Pago` sin agregar tablas obligatorias.
- Backend-truth gate: PASS. OpenAPI y quickstart validan que todas las operaciones protegidas dependan del backend.
- Persistence gate: PASS. Anulacion usa cambio de estado y edicion reemplaza pagos dentro de transaccion.
- Security gate: PASS. Contrato define `bearerAuth` y expiracion declarada de 8 h.
- Modularity gate: PASS. Cambios previstos en rutas/schemas/servicios de admin y ventas.
- UX productivity gate: PASS. Quickstart cubre flujo directo de login, correccion y anulacion.
- AI decoupling gate: PASS. Sin dependencia de IA.
- Export gate: PASS. Contrato preserva comportamiento de ventas activas para listados/reportes.
- Deploy gate: PASS. Configuracion por entorno local, sin servicios cloud.
- Traceability gate: PASS. Respuestas incluyen `estado`, `creado_en`, `modificado_en`; anulacion no elimina registro.
- Evolution gate: PASS. No incluye pantallas dashboard, roles multiples ni auditoria avanzada.

## Project Structure

### Documentation (this feature)

```text
specs/007-admin-ventas/
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
├── requirements.txt                  # agregar PyJWT si no esta presente
├── src/
│   ├── api/
│   │   ├── main.py                   # incluir router de Administracion
│   │   ├── routes/
│   │   │   ├── admin.py              # POST /api/admin/login
│   │   │   └── ventas.py             # PUT/DELETE protegidos
│   │   └── schemas/
│   │       ├── admin.py              # login/token schemas
│   │       └── ventas.py             # update request/response reuse
│   ├── core/
│   │   └── config.py                 # credencial/secreto/expiracion admin
│   ├── services/
│   │   ├── admin_auth.py             # password check, JWT create/verify
│   │   └── ventas_service.py         # update_venta, annul_venta
│   └── models/
│       ├── venta.py
│       ├── pago.py
│       └── cliente.py
└── tests/
    ├── contract/
    │   └── test_admin_ventas_contract.py
    ├── integration/
    │   └── test_admin_ventas.py
    └── unit/
        ├── test_admin_auth.py
        └── test_ventas_admin_service.py

frontend/
├── src/
│   ├── services/
│   │   └── ventasApi.ts              # clientes HTTP para login/admin ventas si hay UI
│   └── types/
│       └── venta.ts                  # tipos de request/response si hay UI
└── tests/
    └── unit/
```

**Structure Decision**: Web application modular existente. Se agrega un modulo backend
`Administracion` para login/JWT y se extiende `Ventas` para edicion/anulacion. Frontend
solo se toca si se implementa una UI consumidora; el contrato API es suficiente para esta fase.

## Complexity Tracking

No constitutional violations identified in planning or design.

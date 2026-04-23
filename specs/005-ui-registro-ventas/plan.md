# Implementation Plan: UI Registro de Ventas

**Branch**: `005-ui-registro-ventas` | **Date**: 2026-04-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-ui-registro-ventas/spec.md`

## Summary

Implementar una UI de registro de ventas en una sola vista para captura rapida de datos comerciales y pagos multiples, reutilizando contratos backend existentes (`/api/clientes`, `/api/medios-pago`, `/api/ventas`) y reforzando validacion visual de cuadre entre `valor_total` y suma de pagos antes de enviar.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript + React 18 (frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.x, Pydantic, React, Vite, Tailwind CSS  
**Storage**: SQLite local (`ventas.db`) con compatibilidad a PostgreSQL  
**Testing**: pytest (backend) + validacion funcional manual guiada en quickstart para frontend en esta fase  
**Target Platform**: Aplicacion web local en LAN (navegador de escritorio principal)  
**Project Type**: Web application (backend API + frontend SPA)  
**Performance Goals**: Completar registro valido en < 2 min; feedback de validacion de pagos en < 200 ms por interaccion en cliente  
**Constraints**: Minimos clics, una sola vista, bloqueo de envio si pagos != total, operacion local-first sin dependencia cloud  
**Scale/Scope**: Flujo transaccional de 2 operadores concurrentes, alta frecuencia de registros diarios, pagos de 1..N por venta

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Design Gate:
- Simplicity gate: PASS. Se propone una sola pantalla y componentes UI acotados, sin capas extra.
- Domain gate: PASS. Se usa modelo existente Venta/Cliente/Pago y su relacion 1:N para pagos.
- Backend-truth gate: PASS. El backend mantiene validacion final de consistencia de montos.
- Persistence gate: PASS. No se altera el modelo SQLAlchemy ni su compatibilidad PostgreSQL.
- Security gate: PASS. No se introduce nuevo esquema de autenticacion; se mantiene seguridad vigente.
- Modularity gate: PASS. Impacto concentrado en modulo Ventas (frontend) y consumo de modulos Clientes/MediosPago.
- UX productivity gate: PASS. Se prioriza autocomplete, autocompletado de telefono y pagos dinamicos.
- AI decoupling gate: PASS. Sin dependencia de `/api/analisis`.
- Export gate: PASS. No cambia exportacion en esta fase, pero mejora consistencia de datos de origen.
- Deploy gate: PASS. Flujo pensado para ejecucion local con backend actual y frontend Vite.
- Traceability gate: PASS. Se preservan timestamps/estado en backend; UI no rompe trazabilidad.
- Evolution gate: PASS. Alcance limitado a UI de captura y validacion; sin sobrealcance a reportes/admin.

Post-Design Gate (re-check):
- Simplicity gate: PASS. Diseño final con form state + tabla dinamica sin sobrearquitectura.
- Domain gate: PASS. Contratos y modelo de datos mantienen entidades base y relaciones.
- Backend-truth gate: PASS. El POST `/api/ventas` sigue siendo autoridad para validar cuadre final.
- Persistence gate: PASS. Sin cambios de persistencia en esta fase de UI.
- Security gate: PASS. Sin ampliacion de superficie sensible.
- Modularity gate: PASS. Separacion clara entre componentes de formulario y servicios API.
- UX productivity gate: PASS. Flujo optimizado para captura continua con minima friccion.
- AI decoupling gate: PASS. Feature totalmente desacoplada de IA.
- Export gate: PASS. Datos consistentes fortalecen salidas formales/informales posteriores.
- Deploy gate: PASS. Compatible con despliegue local/LAN y Docker Compose existente.
- Traceability gate: PASS. Payload conserva campos trazables gestionados por backend.
- Evolution gate: PASS. Se mantiene foco de fase sin adelantar funcionalidades futuras.

## Project Structure

### Documentation (this feature)

```text
specs/005-ui-registro-ventas/
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
│   │   ├── main.py
│   │   ├── routes/
│   │   │   ├── ventas.py
│   │   │   ├── clientes.py
│   │   │   └── medios_pago.py
│   │   └── schemas/
│   │       ├── ventas.py
│   │       ├── clientes.py
│   │       └── medios_pago.py
│   ├── services/
│   │   └── ventas_service.py
│   └── models/
│       ├── venta.py
│       ├── pago.py
│       └── cliente.py
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

frontend/
├── src/
│   ├── pages/
│   │   └── RegistroVentasPage.tsx
│   ├── components/
│   │   ├── venta/VentaFormFields.tsx
│   │   ├── venta/PagosTable.tsx
│   │   └── venta/PagoRow.tsx
│   ├── services/
│   │   ├── ventasApi.ts
│   │   ├── clientesApi.ts
│   │   └── mediosPagoApi.ts
│   ├── hooks/
│   │   └── useRegistroVentaForm.ts
│   ├── types/
│   │   └── venta.ts
│   └── utils/
│       └── money.ts
└── tests/
    ├── unit/
    └── integration/
```

**Structure Decision**: Arquitectura web app con backend existente y nuevo frontend modular por feature. No se modifican contratos nucleares de persistencia; se agrega capa UI para orquestar consumo de APIs ya disponibles y validar experiencia de captura.

## Complexity Tracking

No constitutional violations identified in planning or design.

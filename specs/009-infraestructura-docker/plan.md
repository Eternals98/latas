# Implementation Plan: Infraestructura Docker

**Branch**: `009-infraestructura-docker` | **Date**: 2026-04-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-infraestructura-docker/spec.md`

## Summary

Implementar un despliegue local reproducible para LATAS Ventas con Docker Compose
como punto de arranque, Nginx como proxy local, frontend React servido como build
estatico, backend FastAPI como fuente de verdad y acceso unificado mediante
`http://ventas.local`. La entrega corrige la composicion local existente para incluir
frontend, backend y proxy, documenta la entrada de hosts y agrega verificaciones de
arranque, apagado y diagnostico basico.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript + React 19 (frontend), Nginx stable para proxy  
**Primary Dependencies**: FastAPI, Uvicorn, SQLAlchemy 2.x, Pydantic, React, Vite, Tailwind CSS, Docker Compose, Nginx  
**Storage**: SQLite local (`ventas.db`) montado/persistido para backend; compatible con futura configuracion PostgreSQL  
**Testing**: pytest backend, `npm run build` y `npm run lint` frontend, validacion manual/automatizable de Compose y `GET /api/health` via proxy  
**Target Platform**: Maquina local o LAN con Docker Desktop/Engine, navegador de escritorio, operacion offline-capable tras preparar imagenes/dependencias  
**Project Type**: Web application (backend API + frontend SPA + proxy local)  
**Performance Goals**: Aplicacion accesible en < 30 s tras `compose up` cuando las imagenes ya existen; health visible en < 5 s despues de backend listo  
**Constraints**: local-first, sin cloud obligatorio, no publicar internet, usuario normal sin login, admin con JWT existente, `ventas.local` como entrada estable  
**Scale/Scope**: Entorno local/LAN para operacion de hasta 2 equipos, un backend, un frontend estatico y un proxy; sin CI/CD, TLS publico ni observabilidad avanzada

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Pre-Design Gate:
- Simplicity gate: PASS. Se mantiene una composicion local con tres servicios necesarios: frontend, backend y proxy.
- Domain gate: PASS. No se crean entidades de negocio; `Venta`, `Cliente` y `Pago` siguen servidas por el backend actual.
- Backend-truth gate: PASS. Nginx solo enruta; las reglas criticas continuan en FastAPI.
- Persistence gate: PASS. SQLite local sigue siendo la persistencia inicial y el backend conserva compatibilidad SQLAlchemy/PostgreSQL.
- Security gate: PASS. Alcance local/LAN, sin OAuth ni proveedores externos; admin JWT existente sin cambios de modelo.
- Modularity gate: PASS. Impacto acotado a infraestructura local, configuracion frontend de API y documentacion.
- UX productivity gate: PASS. `ventas.local` elimina friccion de puertos para usuarios locales.
- AI decoupling gate: PASS. No modifica `/api/analisis` ni acopla IA al despliegue.
- Export gate: PASS. No altera reportes/exportaciones; solo cambia forma de ejecutar localmente.
- Deploy gate: PASS. La feature implementa Docker Compose y operacion LAN/offline-capable.
- Traceability gate: PASS. Configuracion versionada documenta servicios, entrada local, puertos y health checks.
- Evolution gate: PASS. CI/CD, cloud, TLS publico, backups y monitoreo quedan fuera de esta fase.

Post-Design Gate (re-check):
- Simplicity gate: PASS. `docker-compose.yml`, `nginx/` y Dockerfiles cubren el alcance sin orquestadores adicionales.
- Domain gate: PASS. El contrato de despliegue no redefine modelos ni relaciones de dominio.
- Backend-truth gate: PASS. El contrato fija `/api/*` hacia backend y frontend como consumidor.
- Persistence gate: PASS. La persistencia se limita a archivo/volumen SQLite local configurable.
- Security gate: PASS. El punto de entrada es HTTP local; no se exponen credenciales nuevas ni auth externa.
- Modularity gate: PASS. Los cambios previstos se ubican en raiz, `backend/`, `frontend/`, `nginx/` y docs.
- UX productivity gate: PASS. Quickstart prioriza abrir `http://ventas.local` y verificar health.
- AI decoupling gate: PASS. Sin dependencia de IA.
- Export gate: PASS. Exportaciones existentes siguen pasando por backend bajo `/api`.
- Deploy gate: PASS. Quickstart incluye arranque, apagado, reinicio y hosts.
- Traceability gate: PASS. Data model de infraestructura identifica servicios, host local y health checks.
- Evolution gate: PASS. Plan deja fuera despliegue publico y automatizaciones posteriores.

## Project Structure

### Documentation (this feature)

```text
specs/009-infraestructura-docker/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── deployment.md
└── tasks.md
```

### Source Code (repository root)

```text
.
├── docker-compose.yml                # composicion local frontend/backend/proxy
├── .dockerignore
├── docs/
│   └── docker-local.md               # guia operativa y hosts
├── nginx/
│   └── conf.d/
│       └── default.conf              # proxy ventas.local, /api hacia backend
├── backend/
│   ├── Dockerfile                    # imagen FastAPI/Uvicorn
│   ├── .env.example                  # variables locales no secretas
│   ├── src/
│   │   ├── api/main.py               # CORS/origen local si aplica
│   │   └── core/config.py            # settings existentes
│   └── tests/
│       └── integration/
│           └── test_health.py
└── frontend/
    ├── Dockerfile                    # build estatico Vite
    ├── nginx.conf                    # servidor estatico interno si aplica
    ├── package.json
    └── src/
        └── services/
            ├── httpClient.ts         # base relativa /api para proxy
            └── ventasApi.ts          # export usando misma base de API
```

**Structure Decision**: Web application existente. Se extiende la infraestructura local
en la raiz del repositorio y se agregan archivos de contenedor por componente. Nginx
queda como proxy de borde local y el backend conserva reglas y persistencia. No se
agregan servicios nuevos de base de datos, colas, cache, TLS publico ni observabilidad.

## Complexity Tracking

No constitutional violations identified in planning or design.

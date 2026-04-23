# Tasks: Core Backend y Modelo de Datos

**Input**: Design documents from `/specs/001-core-backend-modelo-datos/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Se incluyen pruebas mínimas de humo y validaciones estructurales por consistencia con plan/research.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
Prefer focused, single-thread execution of high-priority work; only mark `[P]` when true file-level independence exists.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`
- This feature is backend-first; `frontend/` remains out of scope for implementation tasks

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar estructura mínima del backend y bases de despliegue reproducible local

- [X] T001 Create backend folder scaffold in `backend/src/api/routes`, `backend/src/api/schemas`, `backend/src/core`, `backend/src/db`, `backend/src/models`, `backend/tests/integration`, `backend/tests/unit`, `backend/scripts`
- [X] T002 [P] Create Python package markers in `backend/src/__init__.py`, `backend/src/api/__init__.py`, `backend/src/api/schemas/__init__.py`, `backend/src/db/__init__.py`, `backend/src/models/__init__.py`
- [X] T003 Create dependency manifest in `backend/requirements.txt`
- [X] T004 [P] Create local environment template in `backend/.env.example`
- [X] T005 Create backend ignore rules in `backend/.gitignore`
- [X] T006 Create deployment foundation file in `docker-compose.yml`
- [X] T007 Create backend container foundation in `backend/Dockerfile`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura base obligatoria antes de cualquier historia de usuario

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Create application settings loader in `backend/src/core/config.py`
- [X] T009 Create SQLAlchemy base and shared metadata in `backend/src/db/base.py`
- [X] T010 Create engine/session management in `backend/src/db/session.py`
- [X] T011 Create database bootstrap script with `create_all` in `backend/src/db/init_db.py`
- [X] T012 Create API app bootstrap and router mounting in `backend/src/api/main.py`
- [X] T013 [P] Create API router package export in `backend/src/api/routes/__init__.py`
- [X] T014 Create pytest base configuration in `backend/tests/conftest.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Inicializar servicio base (Priority: P1) 🎯 MVP

**Goal**: Exponer un backend funcional con endpoint `/api/health` para verificación operativa

**Independent Test**: Ejecutar la API y consultar `GET /api/health`, esperando respuesta `{ "status": "ok" }`

### Implementation for User Story 1

- [X] T015 [P] [US1] Create health endpoint integration test in `backend/tests/integration/test_health.py`
- [X] T016 [US1] Create health response schema in `backend/src/api/schemas/health.py`
- [X] T017 [US1] Create health endpoint handler in `backend/src/api/routes/health.py`
- [X] T018 [US1] Register health route under `/api` in `backend/src/api/main.py`
- [X] T019 [US1] Document API run and health validation in `backend/README.md`

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Definir estructura de datos principal (Priority: P1)

**Goal**: Implementar entidades Cliente, Venta y Pago con campos requeridos y trazabilidad mínima

**Independent Test**: Ejecutar inicialización DB y verificar creación de tablas `cliente`, `venta` y `pago`

### Implementation for User Story 2

- [X] T020 [US2] Create Cliente model in `backend/src/models/cliente.py`
- [X] T021 [US2] Create Venta model with enums and traceability fields in `backend/src/models/venta.py`
- [X] T022 [US2] Create Pago model with required fields in `backend/src/models/pago.py`
- [X] T023 [US2] Export model imports in `backend/src/models/__init__.py`
- [X] T024 [US2] Wire model metadata loading before `create_all` in `backend/src/db/init_db.py`
- [X] T025 [US2] Add DB schema smoke check script in `backend/scripts/check_schema.py`
- [X] T026 [P] [US2] Add model persistence smoke test in `backend/tests/unit/test_models_persistence.py`

**Checkpoint**: User Story 2 should persist all core entities independently

---

## Phase 5: User Story 3 - Establecer relaciones y reglas estructurales (Priority: P2)

**Goal**: Definir relaciones 1:N de pagos y opcionalidad de cliente en ventas

**Independent Test**: Confirmar que una venta puede existir sin cliente, que un pago exige `venta_id` válido y que una venta acepta 2+ pagos

### Implementation for User Story 3

- [X] T027 [US3] Add `Cliente` -> `Venta` relationship mapping in `backend/src/models/cliente.py`
- [X] T028 [US3] Add `Venta` -> `Cliente` nullable FK and relationship in `backend/src/models/venta.py`
- [X] T029 [US3] Add `Venta` -> `Pago` one-to-many relationship in `backend/src/models/venta.py`
- [X] T030 [US3] Add `Pago` -> `Venta` many-to-one relationship and FK rule in `backend/src/models/pago.py`
- [X] T031 [US3] Add model-level constraints for `valor_total >= 0` and `monto > 0` in `backend/src/models/venta.py` and `backend/src/models/pago.py`
- [X] T032 [US3] Create relation validation script in `backend/scripts/validate_relations.py`
- [X] T033 [US3] Create multi-payment scenario validation script in `backend/scripts/validate_multi_pago.py`
- [X] T034 [P] [US3] Add relation and multi-payment unit tests in `backend/tests/unit/test_relations_and_multi_pago.py`

**Checkpoint**: User Story 3 should enforce structural integrity without business logic avanzada

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cerrar coherencia documental, control de alcance y preparación de implementación

- [X] T035 [P] Align API contract with implemented health schema in `specs/001-core-backend-modelo-datos/contracts/openapi.yaml`
- [X] T036 Update feature quickstart with actual local and compose-base commands in `specs/001-core-backend-modelo-datos/quickstart.md`
- [X] T037 Add explicit out-of-scope guardrails for business logic in `specs/001-core-backend-modelo-datos/implementation-guardrails.md`
- [X] T038 Update research with implementation status and phase-2 carryovers in `specs/001-core-backend-modelo-datos/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion
- **User Story 3 (Phase 5)**: Depends on User Story 2 completion (requires existing models)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Puede ejecutarse primero para validar endpoint base
- **User Story 2 (P1)**: Puede ejecutarse tras US1 o en paralelo si el equipo separa archivos sin conflicto
- **User Story 3 (P2)**: Depende de US2 porque consolida relaciones sobre modelos ya definidos

### Within Each User Story

- Tests de humo estructurales antes o en paralelo al desarrollo cuando no haya conflicto de archivos
- Modelos antes de scripts de validación
- Routing antes de documentación de uso
- Story complete before moving to next priority

### Parallel Opportunities

- Setup: T002 y T004
- Foundational: T013 en paralelo con T008-T012
- US1: T015 en paralelo con T016-T017
- US2: T020-T022 en paralelo
- US3: T034 en paralelo con T032-T033 cuando los modelos estén listos
- Polish: T035 en paralelo con T036

---

## Parallel Example: User Story 2

```bash
# Parallel model creation after foundational phase:
Task: "Create Cliente model in backend/src/models/cliente.py"
Task: "Create Venta model with enums and traceability fields in backend/src/models/venta.py"
Task: "Create Pago model with required fields in backend/src/models/pago.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verificar `GET /api/health`
5. Usar este hito como base para continuar

### Incremental Delivery

1. Setup + Foundational
2. Add User Story 1 -> Validar health
3. Add User Story 2 -> Validar tablas y campos
4. Add User Story 3 -> Validar relaciones y escenario de 2+ pagos
5. Polish final de contratos, quickstart y guardrails

### Parallel Team Strategy

1. Equipo completa Setup + Foundational
2. Luego dividir:
   - Developer A: US1
   - Developer B: US2
3. US3 inicia al cerrar US2

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Keep tasks specific and avoid multitasking across stories unless explicitly justified
- Commit after each task or logical group
- Stop at each checkpoint to validate independently
- Avoid same-file conflicts between parallel tasks

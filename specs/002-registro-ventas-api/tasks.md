# Tasks: Registro de Ventas API

**Input**: Design documents from `/specs/002-registro-ventas-api/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Se incluyen pruebas automatizadas porque el plan define testing con pytest y el feature requiere validacion de flujo y errores de negocio.

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

**Purpose**: Preparar estructura minima del feature de ventas sin afectar otros modulos

- [X] T001 Create ventas schema module scaffold in `backend/src/api/schemas/ventas.py`
- [X] T002 Create ventas route module scaffold in `backend/src/api/routes/ventas.py`
- [X] T003 Create ventas service module scaffold in `backend/src/services/ventas_service.py`
- [X] T004 Create service package marker in `backend/src/services/__init__.py`
- [X] T005 Create integration test file scaffold in `backend/tests/integration/test_ventas_create.py`
- [X] T006 Create unit test file scaffold in `backend/tests/unit/test_ventas_validations.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contratos y wiring base obligatorios antes de historias de usuario

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Define create request/response schemas in `backend/src/api/schemas/ventas.py`
- [X] T008 Add reusable domain validation helpers for decimal totals in `backend/src/services/ventas_service.py`
- [X] T009 Register ventas router import and mount in `backend/src/api/main.py`
- [X] T010 Add API route exports for ventas in `backend/src/api/routes/__init__.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Registrar venta con pagos multiples (Priority: P1) 🎯 MVP

**Goal**: Permitir crear una venta con uno o multiples pagos y devolver el recurso creado

**Independent Test**: Ejecutar `POST /api/ventas` con dos pagos que sumen el total y validar respuesta 201 con venta + pagos

### Tests for User Story 1

- [X] T011 [US1] Add integration success test for multi-payment sale creation in `backend/tests/integration/test_ventas_create.py`
- [X] T012 [US1] Add unit test for successful aggregate build in `backend/tests/unit/test_ventas_validations.py`

### Implementation for User Story 1

- [X] T013 [US1] Implement transactional create sale service for valid payloads in `backend/src/services/ventas_service.py`
- [X] T014 [US1] Implement `POST /api/ventas` handler returning 201 in `backend/src/api/routes/ventas.py`
- [X] T015 [US1] Map ORM entities to response schema with nested pagos in `backend/src/api/schemas/ventas.py`

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Rechazar inconsistencias de montos (Priority: P1)

**Goal**: Rechazar solicitudes cuando la suma de pagos no coincide con `valor_total`

**Independent Test**: Enviar `POST /api/ventas` con suma de pagos distinta al total y validar error 400 sin persistencia parcial

### Tests for User Story 2

- [X] T016 [US2] Add integration test for total mismatch error 400 in `backend/tests/integration/test_ventas_create.py`
- [X] T017 [US2] Add unit test for decimal equality validation rule in `backend/tests/unit/test_ventas_validations.py`

### Implementation for User Story 2

- [X] T018 [US2] Enforce sum-of-payments equals total validation in `backend/src/services/ventas_service.py`
- [X] T019 [US2] Return standardized 400 error payload for mismatch rule in `backend/src/api/routes/ventas.py`
- [X] T020 [US2] Ensure rollback behavior on mismatch in `backend/src/services/ventas_service.py`

**Checkpoint**: User Stories 1 and 2 should work independently with success and mismatch flows

---

## Phase 5: User Story 3 - Rechazar datos incompletos obligatorios (Priority: P2)

**Goal**: Rechazar solicitudes incompletas (`empresa`, `tipo`, `pagos`) con error 400

**Independent Test**: Enviar solicitudes sin campos obligatorios o con `pagos` vacio y validar error 400

### Tests for User Story 3

- [X] T021 [US3] Add integration test for missing required fields in `backend/tests/integration/test_ventas_create.py`
- [X] T022 [US3] Add integration test for empty pagos list in `backend/tests/integration/test_ventas_create.py`
- [X] T023 [US3] Add unit tests for request-level required data validation in `backend/tests/unit/test_ventas_validations.py`

### Implementation for User Story 3

- [X] T024 [US3] Enforce required request fields and min one payment in `backend/src/api/schemas/ventas.py`
- [X] T025 [US3] Normalize 400 error responses for incomplete payloads in `backend/src/api/routes/ventas.py`
- [X] T026 [US3] Validate positive payment amount before persistence in `backend/src/services/ventas_service.py`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cierre de consistencia documental y validacion operativa final

- [X] T027 [P] Update API contract for `POST /api/ventas` success/error examples in `specs/002-registro-ventas-api/contracts/openapi.yaml`
- [X] T028 [P] Update manual verification steps with final curl payloads in `specs/002-registro-ventas-api/quickstart.md`
- [X] T029 Update backend usage notes for ventas endpoint in `backend/README.md`
- [X] T030 Add contract smoke test for `POST /api/ventas` request/response schema alignment in `backend/tests/contract/test_ventas_contract.py`
- [X] T031 Add local performance smoke test for `POST /api/ventas` under target threshold in `backend/tests/integration/test_ventas_performance.py`
- [X] T032 Run full backend test suite and record execution notes in `specs/002-registro-ventas-api/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 baseline implementation
- **User Story 3 (Phase 5)**: Depends on User Story 1 and User Story 2 baseline validations
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First functional increment (MVP)
- **User Story 2 (P1)**: Extiende US1 con regla critica de consistencia monetaria
- **User Story 3 (P2)**: Extiende validaciones compartidas de US1 y US2 para completitud de payload

### Within Each User Story

- Tests should be written before implementation and fail first
- Schema and service validations before route finalization
- Endpoint behavior before documentation updates
- Complete each story checkpoint before moving to next priority

### Parallel Opportunities

- Setup: ninguna recomendada para mantener foco secuencial
- Foundational: ninguna recomendada para evitar conflicto en wiring base
- US1-US3: ejecutar en secuencia por alta comparticion de archivos
- Polish: T027 y T028 pueden ejecutarse en paralelo (archivos distintos)

---

## Parallel Example: Polish Phase

```bash
Task: "Update API contract for POST /api/ventas in specs/002-registro-ventas-api/contracts/openapi.yaml"
Task: "Update quickstart curl validation in specs/002-registro-ventas-api/quickstart.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: probar creacion exitosa con curl
5. Entregar MVP tecnico de registro

### Incremental Delivery

1. Setup + Foundational
2. Add User Story 1 -> validar 201 con venta y pagos
3. Add User Story 2 -> validar 400 por descuadre de montos
4. Add User Story 3 -> validar 400 por datos incompletos
5. Polish documental + pruebas finales

### Focused Team Strategy

1. Ejecutar fases en orden, una tarea a la vez
2. Evitar multitarea entre historias por alta dependencia en los mismos archivos
3. Solo paralelizar actualizaciones documentales finales si se requiere acelerar cierre

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story remains independently testable via its checkpoint
- Keep task execution focused to respect project instruction of specific-task workflow
- Avoid same-file conflicts by completing one story at a time

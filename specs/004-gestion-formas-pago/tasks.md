# Tasks: Gestion de Formas de Pago

**Input**: Design documents from `/specs/004-gestion-formas-pago/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Se incluyen pruebas automatizadas porque el plan define `pytest (unit + integration + contract)` y los criterios de exito exigen validar disponibilidad, consistencia y consumo del catalogo.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
Prefer focused, single-thread execution of high-priority work; only mark `[P]` when true file-level independence exists.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`
- Esta feature es backend-first; el frontend consumidor queda fuera de implementacion directa

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar estructura minima del modulo Medios de Pago

- [X] T001 Create medios de pago API route scaffold in `backend/src/api/routes/medios_pago.py`
- [X] T002 Create medios de pago schema scaffold in `backend/src/api/schemas/medios_pago.py`
- [X] T003 Create medios de pago service scaffold in `backend/src/services/medios_pago_service.py`
- [X] T004 Create medio de pago model scaffold in `backend/src/models/medio_pago.py`
- [X] T005 Create integration test scaffold for medios de pago API in `backend/tests/integration/test_medios_pago_api.py`
- [X] T006 Create contract test scaffold for medios de pago endpoint in `backend/tests/contract/test_medios_pago_contract.py`
- [X] T007 Create unit test scaffold for medios de pago service in `backend/tests/unit/test_medios_pago_service.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wiring base compartido obligatorio antes de historias de usuario

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Register `MedioPago` model export in `backend/src/models/__init__.py`
- [X] T009 Register medios de pago router symbols in `backend/src/api/routes/__init__.py` and `backend/src/api/main.py`
- [X] T010 Add `medio_pago` model import to DB bootstrap in `backend/src/db/init_db.py`
- [X] T011 Define shared response schemas (`MedioPagoResponse`, list mapper) in `backend/src/api/schemas/medios_pago.py`
- [X] T012 Implement shared service helpers for deterministic ordering and active filtering in `backend/src/services/medios_pago_service.py`
- [X] T013 Implement initial catalog seed utility with required 10 medios in `backend/src/services/medios_pago_service.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Consultar medios de pago centralizados (Priority: P1) 🎯 MVP

**Goal**: Entregar `GET /api/medios-pago` con lista centralizada, completa y consistente

**Independent Test**: Ejecutar `GET /api/medios-pago` y validar respuesta 200 con lista inicial de 10 opciones en orden deterministico

### Tests for User Story 1

- [X] T014 [US1] Add contract test for `GET /api/medios-pago` 200 response shape in `backend/tests/contract/test_medios_pago_contract.py`
- [X] T015 [US1] Add integration test for initial catalog list (10 medios requeridos) in `backend/tests/integration/test_medios_pago_api.py`
- [X] T016 [US1] Add unit test for active-only filtering and deterministic sorting in `backend/tests/unit/test_medios_pago_service.py`

### Implementation for User Story 1

- [X] T017 [US1] Implement `MedioPago` entity fields and constraints in `backend/src/models/medio_pago.py`
- [X] T018 [US1] Implement read service to list active medios de pago in `backend/src/services/medios_pago_service.py`
- [X] T019 [US1] Implement `GET /api/medios-pago` endpoint in `backend/src/api/routes/medios_pago.py`
- [X] T020 [US1] Wire catalog seed execution during DB initialization in `backend/src/db/init_db.py`

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Mantener independencia del frontend (Priority: P1)

**Goal**: Proveer respuesta lista para UI sin hardcodeo de opciones en cliente

**Independent Test**: Consumir `GET /api/medios-pago` desde cliente y poblar selector sin listas locales hardcodeadas

### Tests for User Story 2

- [X] T021 [US2] Add integration test asserting response includes `id`, `codigo`, `nombre`, `activo`, `creado_en`, `modificado_en` in `backend/tests/integration/test_medios_pago_api.py`
- [X] T022 [US2] Add contract test examples focused on frontend selector consumption in `backend/tests/contract/test_medios_pago_contract.py`

### Implementation for User Story 2

- [X] T023 [US2] Implement stable `codigo` values for initial catalog entries in `backend/src/services/medios_pago_service.py`
- [X] T024 [US2] Ensure route uses schema mappers without frontend-side transformations in `backend/src/api/routes/medios_pago.py` and `backend/src/api/schemas/medios_pago.py`
- [X] T025 [US2] Add endpoint usage and no-hardcode guidance in `backend/README.md`
- [X] T026 [US2] Update consumer verification steps for selector refresh in `specs/004-gestion-formas-pago/quickstart.md`

**Checkpoint**: User Stories 1 and 2 should work independently and together in payment selection flows

---

## Phase 5: User Story 3 - Preparar evolucion a CRUD (Priority: P2)

**Goal**: Dejar base de dominio y contrato estable para CRUD futuro sin implementarlo ahora

**Independent Test**: Verificar que cada medio tiene identificacion estable y trazabilidad; validar que solo se expone lectura en esta fase

### Tests for User Story 3

- [X] T027 [US3] Add unit test for uniqueness/stability of `codigo` and traceability defaults in `backend/tests/unit/test_medios_pago_service.py`
- [X] T028 [US3] Add integration test for empty valid response when no medios activos remain in `backend/tests/integration/test_medios_pago_api.py`

### Implementation for User Story 3

- [X] T029 [US3] Enforce unique constraints and traceability fields (`creado_en`, `modificado_en`, `activo`) in `backend/src/models/medio_pago.py`
- [X] T030 [US3] Implement service behavior for CRUD-readiness boundaries (active filter + no write exposure) in `backend/src/services/medios_pago_service.py`
- [X] T031 [US3] Align OpenAPI contract fields and out-of-scope CRUD note in `specs/004-gestion-formas-pago/contracts/openapi.yaml`
- [X] T032 [US3] Document deferred CRUD scope and migration intent in `specs/004-gestion-formas-pago/research.md`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cierre documental, verificacion final y consistencia transversal

- [X] T033 [P] Sync quickstart curl examples with final API payload in `specs/004-gestion-formas-pago/quickstart.md`
- [X] T034 [P] Sync contract examples and schema notes in `specs/004-gestion-formas-pago/contracts/openapi.yaml`
- [X] T035 Run targeted medios de pago test suite and append execution notes in `specs/004-gestion-formas-pago/research.md`
- [X] T036 Run full backend test suite and record summary in `specs/004-gestion-formas-pago/research.md`
- [X] T037 Define protocolo de medicion de tiempo de seleccion de medio de pago (<5s) en `specs/004-gestion-formas-pago/quickstart.md`
- [ ] T038 Ejecutar prueba manual con operadores y registrar resultado de SC-003 en `specs/004-gestion-formas-pago/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 endpoint baseline
- **User Story 3 (Phase 5)**: Depends on User Story 1/2 data contract stabilization
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First functional increment (MVP de catalogo centralizado)
- **User Story 2 (P1)**: Extiende contrato para consumo frontend sin hardcodeo
- **User Story 3 (P2)**: Consolida readiness de dominio para CRUD futuro sin exponer escrituras

### Within Each User Story

- Tests should be written before implementation and fail first
- Model + service base before endpoint behavior finalization
- Endpoint behavior before contract/documentation sync
- Complete each story checkpoint before moving to next priority

### Parallel Opportunities

- Setup: ejecucion secuencial recomendada por alta comparticion de archivos
- Foundational: ejecucion secuencial recomendada para evitar conflictos de wiring
- User stories: ejecucion secuencial recomendada para mantener foco y trazabilidad
- Polish: T033 y T034 pueden ejecutarse en paralelo (archivos distintos)

---

## Parallel Example: Polish Phase

```bash
Task: "Sync quickstart curl examples in specs/004-gestion-formas-pago/quickstart.md"
Task: "Sync OpenAPI examples in specs/004-gestion-formas-pago/contracts/openapi.yaml"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: probar `GET /api/medios-pago` con lista inicial completa
5. Entregar MVP tecnico de catalogo centralizado

### Incremental Delivery

1. Setup + Foundational
2. Add User Story 1 -> validar disponibilidad y orden deterministico
3. Add User Story 2 -> validar consumo frontend sin hardcodeo
4. Add User Story 3 -> validar readiness de contrato para CRUD futuro
5. Polish documental + ejecucion final de pruebas

### Focused Team Strategy

1. Ejecutar fases en orden, una tarea a la vez
2. Evitar multitarea entre historias por comparticion de archivos en modulo de pagos
3. Solo paralelizar tareas documentales finales cuando no haya conflictos

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story remains independently testable via its checkpoint
- Keep task execution focused to respect project instruction of specific-task workflow
- Avoid same-file conflicts by completing one story at a time


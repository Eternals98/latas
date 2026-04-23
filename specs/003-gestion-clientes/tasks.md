# Tasks: Gestion de Clientes

**Input**: Design documents from `/specs/003-gestion-clientes/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Se incluyen pruebas automatizadas porque el plan define `pytest (unit + integration + contract)` y los criterios de exito exigen validar busqueda, creacion y no-duplicidad.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
Prefer focused, single-thread execution of high-priority work; only mark `[P]` when true file-level independence exists.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`
- This feature is backend-first; frontend autocomplete consumer remains out of implementation scope

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar estructura minima del modulo Clientes sin tocar alcance fuera del feature

- [X] T001 Create clientes API route module scaffold in `backend/src/api/routes/clientes.py`
- [X] T002 Create clientes schema module scaffold in `backend/src/api/schemas/clientes.py`
- [X] T003 Create clientes service module scaffold in `backend/src/services/clientes_service.py`
- [X] T004 Create integration test scaffold for clientes API in `backend/tests/integration/test_clientes_api.py`
- [X] T005 Create unit test scaffold for clientes service in `backend/tests/unit/test_clientes_service.py`
- [X] T006 Create contract test scaffold for clientes endpoints in `backend/tests/contract/test_clientes_contract.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wiring base y utilidades compartidas obligatorias antes de historias de usuario

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Register clientes router in API application bootstrap `backend/src/api/main.py`
- [X] T008 Export clientes router symbol in `backend/src/api/routes/__init__.py`
- [X] T009 Define shared request/response schemas and error payloads for clientes in `backend/src/api/schemas/clientes.py`
- [X] T010 Implement name normalization helper for duplicate checks and trimmed search handling in `backend/src/services/clientes_service.py`
- [X] T011 Add DB lookup helpers for exact and partial name matching in `backend/src/services/clientes_service.py`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Buscar clientes para autocompletar (Priority: P1) 🎯 MVP

**Goal**: Entregar busqueda parcial de clientes para autocompletado con limite de 10 resultados

**Independent Test**: Ejecutar `GET /api/clientes?search=andi` y validar respuesta 200 con lista de coincidencias de maximo 10 elementos

### Tests for User Story 1

- [X] T012 [US1] Add integration test for partial-name search returning results in `backend/tests/integration/test_clientes_api.py`
- [X] T013 [US1] Add integration test for trimmed search input and empty/no-match behavior in `backend/tests/integration/test_clientes_api.py`
- [X] T014 [US1] Add unit test for top-10 limiter and deterministic ordering in search service logic in `backend/tests/unit/test_clientes_service.py`
- [X] T015 [US1] Add contract test for `GET /api/clientes` query/response shape in `backend/tests/contract/test_clientes_contract.py`

### Implementation for User Story 1

- [X] T016 [US1] Implement partial search service with trim normalization, deterministic ordering, and max-10 cap in `backend/src/services/clientes_service.py`
- [X] T017 [US1] Implement `GET /api/clientes` endpoint and query handling in `backend/src/api/routes/clientes.py`
- [X] T018 [US1] Map ORM Cliente records to API response schema list in `backend/src/api/schemas/clientes.py`

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Crear cliente nuevo (Priority: P1)

**Goal**: Permitir creacion de cliente nuevo y disponibilidad inmediata para busquedas posteriores

**Independent Test**: Ejecutar `POST /api/clientes` con datos validos y luego `GET /api/clientes?search=<nombre>` validando que el cliente creado aparece en resultados

### Tests for User Story 2

- [X] T019 [US2] Add integration test for successful client creation in `backend/tests/integration/test_clientes_api.py`
- [X] T020 [US2] Add integration test for created client being searchable afterward in `backend/tests/integration/test_clientes_api.py`
- [X] T021 [US2] Add unit test for create service validating `nombre` required and `telefono` optional in `backend/tests/unit/test_clientes_service.py`
- [X] T022 [US2] Add contract test for `POST /api/clientes` 201 response with traceability fields in `backend/tests/contract/test_clientes_contract.py`
- [X] T023 [US2] Add integration test for create response including `creado_en`, `modificado_en` and `estado` in `backend/tests/integration/test_clientes_api.py`

### Implementation for User Story 2

- [X] T024 [US2] Implement create-client service flow with persistence in `backend/src/services/clientes_service.py`
- [X] T025 [US2] Implement `POST /api/clientes` endpoint with request validation in `backend/src/api/routes/clientes.py`
- [X] T026 [US2] Add create request parser and created-client response mapper in `backend/src/api/schemas/clientes.py`
- [X] T027 [US2] Add and populate cliente traceability fields (`modificado_en`, `estado`) in `backend/src/models/cliente.py`

**Checkpoint**: User Stories 1 and 2 should work independently and together in capture flow

---

## Phase 5: User Story 3 - Evitar duplicados exactos (Priority: P2)

**Goal**: Bloquear creacion de clientes duplicados exactos y permitir similitudes parciales no exactas

**Independent Test**: Ejecutar dos `POST /api/clientes` con mismo nombre normalizado y validar rechazo en segunda solicitud sin registro duplicado

### Tests for User Story 3

- [X] T028 [US3] Add integration test for exact duplicate rejection in `backend/tests/integration/test_clientes_api.py`
- [X] T029 [US3] Add integration test ensuring partial-name variants are allowed in `backend/tests/integration/test_clientes_api.py`
- [X] T030 [US3] Add unit test for normalization + duplicate decision rules in `backend/tests/unit/test_clientes_service.py`
- [X] T031 [US3] Add contract test for duplicate conflict response (`409`) in `backend/tests/contract/test_clientes_contract.py`

### Implementation for User Story 3

- [X] T032 [US3] Enforce exact-duplicate guard using normalized name in `backend/src/services/clientes_service.py`
- [X] T033 [US3] Return standardized conflict response for duplicate creation in `backend/src/api/routes/clientes.py`
- [X] T034 [US3] Align duplicate error schema/messages in `backend/src/api/schemas/clientes.py`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cierre de documentacion, validacion final y consistencia transversal

- [X] T035 [P] Update cliente API contract examples and constraints in `specs/003-gestion-clientes/contracts/openapi.yaml`
- [X] T036 [P] Update end-to-end curl verification for clientes flow in `specs/003-gestion-clientes/quickstart.md`
- [X] T037 Update backend usage documentation for clientes endpoints in `backend/README.md`
- [X] T038 Add integration performance smoke test for `GET /api/clientes` (<1s local target) in `backend/tests/integration/test_clientes_performance.py`
- [X] T039 Run full backend test suite and append execution notes in `specs/003-gestion-clientes/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 baseline search components
- **User Story 3 (Phase 5)**: Depends on User Story 2 create flow and normalization helper
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: First functional increment (MVP for autocomplete backend)
- **User Story 2 (P1)**: Builds on same clientes module to create and reuse records
- **User Story 3 (P2)**: Extiende create flow con regla de conflicto por duplicado exacto

### Within Each User Story

- Tests should be written before implementation and fail first
- Service logic before route behavior finalization
- Route behavior before documentation updates
- Complete each story checkpoint before moving to next priority

### Parallel Opportunities

- Setup: ninguna recomendada para mantener foco secuencial
- Foundational: ninguna recomendada por alta concurrencia sobre mismos archivos
- US1-US3: ejecucion secuencial recomendada para evitar conflictos en `clientes.py` de rutas/schemas/servicio
- Polish: T035 y T036 pueden ejecutarse en paralelo (archivos distintos)

---

## Parallel Example: Polish Phase

```bash
Task: "Update clientes OpenAPI contract in specs/003-gestion-clientes/contracts/openapi.yaml"
Task: "Update clientes quickstart verification in specs/003-gestion-clientes/quickstart.md"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: probar `GET /api/clientes?search=...` para autocompletado
5. Entregar MVP tecnico de busqueda de clientes

### Incremental Delivery

1. Setup + Foundational
2. Add User Story 1 -> validar busqueda parcial con limite de 10
3. Add User Story 2 -> validar creacion y disponibilidad en busqueda
4. Add User Story 3 -> validar rechazo de duplicado exacto
5. Polish documental + ejecucion final de pruebas

### Focused Team Strategy

1. Ejecutar fases en orden, una tarea a la vez
2. Evitar multitarea entre historias por comparticion de archivos del modulo Clientes
3. Solo paralelizar actualizaciones documentales finales cuando sea seguro

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story remains independently testable via its checkpoint
- Keep task execution focused to respect project instruction of specific-task workflow
- Avoid same-file conflicts by completing one story at a time

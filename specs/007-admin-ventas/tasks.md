# Tasks: Administracion de Ventas

**Input**: Design documents from `/specs/007-admin-ventas/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Included because the plan defines pytest coverage, the feature has explicit independent test criteria, and the API contract must be protected against regressions.

**Organization**: Tasks are grouped by user story so login, sale editing, and logical annulment can be implemented and validated incrementally.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks.
- **[Story]**: User story label, only for story phases.
- Every task includes exact repository-relative file paths.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare dependencies and configuration used by all admin operations.

- [X] T001 Add PyJWT dependency to backend/requirements.txt
- [X] T002 [P] Add admin username, admin password, JWT secret, JWT algorithm, and 8-hour TTL settings in backend/src/core/config.py
- [X] T003 [P] Export the admin routes module from backend/src/api/routes/__init__.py

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schemas and validation surfaces required before any story endpoint can be completed.

**CRITICAL**: No user story work can be completed until this phase is done.

- [X] T004 [P] Create admin login and token schemas in backend/src/api/schemas/admin.py
- [X] T005 [P] Add update sale request parsing helpers reusing create-sale validation rules in backend/src/api/schemas/ventas.py
- [X] T006 [P] Add admin API contract fixture expectations in backend/tests/contract/test_admin_ventas_contract.py
- [X] T007 [P] Add admin integration test data helpers for active and annulled sales in backend/tests/conftest.py

**Checkpoint**: Shared config, schemas, and test scaffolding are ready.

---

## Phase 3: User Story 1 - Acceso administrativo seguro (Priority: P1) MVP

**Goal**: Administrators can log in at `POST /api/admin/login` and receive a JWT valid for 8 hours; invalid, expired, or malformed credentials/tokens are rejected.

**Independent Test**: Call admin login with valid and invalid credentials, decode/verify token expiry, and verify protected endpoints reject missing or expired authorization.

### Tests for User Story 1

- [X] T008 [P] [US1] Add contract tests for `POST /api/admin/login` 200 and 401 responses in backend/tests/contract/test_admin_ventas_contract.py
- [X] T009 [P] [US1] Add unit tests for password validation, token creation, token expiry, and invalid token rejection in backend/tests/unit/test_admin_auth.py
- [X] T010 [P] [US1] Add integration tests for admin login success, elapsed-time behavior, invalid credentials, and missing bearer token on protected routes in backend/tests/integration/test_admin_ventas.py

### Implementation for User Story 1

- [X] T011 [US1] Implement admin credential validation, JWT creation, and JWT verification in backend/src/services/admin_auth.py
- [X] T012 [US1] Implement `POST /api/admin/login` route in backend/src/api/routes/admin.py
- [X] T013 [US1] Register admin router in backend/src/api/main.py
- [X] T014 [US1] Add reusable admin authorization dependency for protected routes in backend/src/services/admin_auth.py
- [X] T015 [US1] Run US1 tests with `pytest backend/tests/unit/test_admin_auth.py backend/tests/contract/test_admin_ventas_contract.py backend/tests/integration/test_admin_ventas.py`

**Checkpoint**: User Story 1 works independently and provides the authorization foundation for US2 and US3.

---

## Phase 4: User Story 2 - Editar ventas registradas (Priority: P2)

**Goal**: Administrators can update editable fields and payments for an active sale through `PUT /api/ventas/{id}` without changing immutable identifiers or traceability fields.

**Independent Test**: Authenticate as admin, update an active sale, confirm the same sale ID is returned with changed editable fields, unchanged immutable fields, valid payment totals, and rejected edits for invalid or annulled sales.

### Tests for User Story 2

- [X] T016 [P] [US2] Add contract tests for `PUT /api/ventas/{id}` 200, 400, 401, 404, and 409 responses in backend/tests/contract/test_admin_ventas_contract.py
- [X] T017 [P] [US2] Add unit tests for update sale validation, payment total matching, non-existent `cliente_id`, not-found handling, and annulled-sale conflict in backend/tests/unit/test_ventas_admin_service.py
- [X] T018 [P] [US2] Add integration tests for successful sale edit, invalid payload rejection, non-existent `cliente_id`, missing token rejection, nonexistent sale, and edit of annulled sale in backend/tests/integration/test_admin_ventas.py

### Implementation for User Story 2

- [X] T019 [US2] Implement `update_venta_with_pagos` service with transactional sale field updates and payment replacement in backend/src/services/ventas_service.py
- [X] T020 [US2] Ensure update service preserves `Venta.id`, `Venta.creado_en`, `Venta.estado`, and updates `Venta.modificado_en` in backend/src/services/ventas_service.py
- [X] T021 [US2] Reject updates with non-existent `cliente_id` before committing changes in backend/src/services/ventas_service.py
- [X] T022 [US2] Add `PUT /api/ventas/{id}` protected route with admin dependency and error mapping in backend/src/api/routes/ventas.py
- [X] T023 [US2] Extend OpenAPI-facing sale schemas for update request/validation messages in backend/src/api/schemas/ventas.py
- [X] T024 [US2] Add lightweight elapsed-time assertions for valid sale edit flow in backend/tests/integration/test_admin_ventas.py
- [X] T025 [US2] Run US2 tests with `pytest backend/tests/unit/test_ventas_admin_service.py backend/tests/contract/test_admin_ventas_contract.py backend/tests/integration/test_admin_ventas.py`

**Checkpoint**: User Story 2 works with admin authorization and does not affect sale creation or monthly report behavior.

---

## Phase 5: User Story 3 - Anular ventas sin borrado fisico (Priority: P3)

**Goal**: Administrators can logically annul sales through `DELETE /api/ventas/{id}` while preserving the original row and excluding annulled sales from active operational results.

**Independent Test**: Authenticate as admin, annul an active sale, confirm the same sale remains with `estado = anulado`, repeat the request safely, and verify monthly active reports exclude the sale.

### Tests for User Story 3

- [X] T026 [P] [US3] Add contract tests for `DELETE /api/ventas/{id}` 200, 401, and 404 responses in backend/tests/contract/test_admin_ventas_contract.py
- [X] T027 [P] [US3] Add unit tests for logical annulment, repeated annulment idempotency, and not-found handling in backend/tests/unit/test_ventas_admin_service.py
- [X] T028 [P] [US3] Add integration tests for authorized annulment, repeated annulment, physical row preservation, active report exclusion, and elapsed-time behavior in backend/tests/integration/test_admin_ventas.py

### Implementation for User Story 3

- [X] T029 [US3] Implement `annul_venta` service that sets `Venta.estado` to `anulado` without deleting records in backend/src/services/ventas_service.py
- [X] T030 [US3] Make `annul_venta` idempotent for already annulled sales while preserving `Venta.id` and payments in backend/src/services/ventas_service.py
- [X] T031 [US3] Add `DELETE /api/ventas/{id}` protected route with admin dependency and not-found error mapping in backend/src/api/routes/ventas.py
- [X] T032 [US3] Verify existing monthly list/export filters still use `EstadoVentaEnum.ACTIVO` in backend/src/services/ventas_service.py
- [X] T033 [US3] Run US3 tests with `pytest backend/tests/unit/test_ventas_admin_service.py backend/tests/contract/test_admin_ventas_contract.py backend/tests/integration/test_admin_ventas.py`

**Checkpoint**: User Story 3 works independently once admin authorization exists and preserves reporting correctness.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation alignment, and regression checks across stories.

- [X] T034 [P] Update backend README admin environment variable documentation in backend/README.md
- [X] T035 [P] Update API client types for admin token, sale update request, and admin sale operations in frontend/src/types/venta.ts
- [X] T036 [P] Add frontend service methods for admin login, update sale, and annul sale in frontend/src/services/ventasApi.ts
- [X] T037 Run complete backend test suite with `pytest backend/tests`
- [X] T038 Run quickstart validation commands from specs/007-admin-ventas/quickstart.md
- [X] T039 Review contracts and implementation behavior against specs/007-admin-ventas/contracts/openapi.yaml

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational; delivers MVP admin login/JWT.
- **US2 (Phase 4)**: Depends on US1 authorization dependency.
- **US3 (Phase 5)**: Depends on US1 authorization dependency; can be implemented after Foundational plus US1 and does not require US2.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories; MVP.
- **User Story 2 (P2)**: Requires US1 auth dependency, otherwise independent from US3.
- **User Story 3 (P3)**: Requires US1 auth dependency, otherwise independent from US2.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001 is understood.
- T004, T005, T006, and T007 can run in parallel because they touch different files.
- US1 test tasks T008, T009, and T010 can run in parallel before implementation.
- US2 test tasks T016, T017, and T018 can run in parallel after US1 authorization behavior is available.
- US3 test tasks T026, T027, and T028 can run in parallel after US1 authorization behavior is available.
- T034, T035, and T036 can run in parallel during polish because they touch docs/frontend files.

---

## Parallel Example: User Story 1

```text
Task: "Add contract tests for POST /api/admin/login 200 and 401 responses in backend/tests/contract/test_admin_ventas_contract.py"
Task: "Add unit tests for password validation, token creation, token expiry, and invalid token rejection in backend/tests/unit/test_admin_auth.py"
Task: "Add integration tests for admin login success, invalid credentials, and missing bearer token on protected routes in backend/tests/integration/test_admin_ventas.py"
```

---

## Parallel Example: User Story 2

```text
Task: "Add contract tests for PUT /api/ventas/{id} 200, 400, 401, 404, and 409 responses in backend/tests/contract/test_admin_ventas_contract.py"
Task: "Add unit tests for update sale validation, payment total matching, not-found handling, and annulled-sale conflict in backend/tests/unit/test_ventas_admin_service.py"
Task: "Add integration tests for successful sale edit, invalid payload rejection, missing token rejection, nonexistent sale, and edit of annulled sale in backend/tests/integration/test_admin_ventas.py"
```

---

## Parallel Example: User Story 3

```text
Task: "Add contract tests for DELETE /api/ventas/{id} 200, 401, and 404 responses in backend/tests/contract/test_admin_ventas_contract.py"
Task: "Add unit tests for logical annulment, repeated annulment idempotency, and not-found handling in backend/tests/unit/test_ventas_admin_service.py"
Task: "Add integration tests for authorized annulment, repeated annulment, physical row preservation, and active report exclusion in backend/tests/integration/test_admin_ventas.py"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1.
3. Validate login success, invalid credentials, token expiry, and protected-route rejection.
4. Stop for review if only MVP authorization is needed.

### Incremental Delivery

1. Deliver US1 admin login/JWT.
2. Deliver US2 sale editing with validation and traceability preservation.
3. Deliver US3 logical annulment and active report exclusion.
4. Complete polish and full backend regression testing.

### Notes

- Keep JWT verification in backend only; frontend token handling is convenience, not security.
- Preserve active report/export filtering when adding admin annulment.
- Do not introduce user tables, OAuth, dashboard screens, or physical purge workflows in this feature.


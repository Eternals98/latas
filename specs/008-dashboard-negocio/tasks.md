# Tasks: Dashboard de Negocio

**Input**: Design documents from `/specs/008-dashboard-negocio/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Tests**: Included because the plan defines pytest/build validation, the quickstart names dashboard test files, and the OpenAPI contract must be protected against regressions.

**Organization**: Tasks are grouped by user story so the `Reportes` dashboard can be implemented incrementally: core indicators first, company breakdown second, payment-method breakdown third.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks.
- **[Story]**: User story label, only for story phases.
- Every task includes exact repository-relative file paths.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare frontend dependency and empty files used by the Reportes dashboard stories.

- [X] T001 Add Recharts dependency to frontend/package.json and frontend/package-lock.json
- [X] T002 [P] Create Reportes dashboard schema placeholder in backend/src/api/schemas/dashboard.py
- [X] T003 [P] Create Reportes dashboard service placeholder in backend/src/services/dashboard_service.py
- [X] T004 [P] Create Reportes dashboard route placeholder in backend/src/api/routes/dashboard.py
- [X] T005 [P] Create Reportes dashboard frontend type placeholder in frontend/src/types/dashboard.ts
- [X] T006 [P] Create Reportes dashboard API client placeholder in frontend/src/services/dashboardApi.ts
- [X] T007 [P] Create Reportes dashboard page placeholder in frontend/src/pages/DashboardPage.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared response contract, routing, and test scaffolding that all dashboard stories depend on.

**CRITICAL**: No user story work can be completed until this phase is done.

- [X] T008 [P] Define base dashboard response schemas with empty arrays and zero totals in backend/src/api/schemas/dashboard.py
- [X] T009 [P] Define TypeScript dashboard response types matching contracts/openapi.yaml in frontend/src/types/dashboard.ts
- [X] T010 [P] Add reusable dashboard API response assertions in backend/tests/contract/test_dashboard_contract.py
- [X] T011 [P] Add dashboard sale/payment fixture helpers in backend/tests/conftest.py
- [X] T012 Register dashboard router import and include_router call in backend/src/api/main.py
- [X] T013 Implement `GET /api/dashboard` route shell returning the dashboard service response in backend/src/api/routes/dashboard.py
- [X] T014 Implement `getDashboard` frontend API client call in frontend/src/services/dashboardApi.ts

**Checkpoint**: Reportes dashboard contract surface exists and user story implementation can begin.

---

## Phase 3: User Story 1 - Visualizar indicadores principales (Priority: P1) MVP

**Goal**: Users can open the dashboard and see active sales by month, total active sales, current-month total, sale count, and ticket promedio.

**Independent Test**: Seed active and annulled sales across multiple months, call `GET /api/dashboard`, and verify monthly totals, current-month total, and ticket promedio include only active sales; open the page and confirm the core indicators render.

### Tests for User Story 1

- [X] T015 [P] [US1] Add contract tests for `GET /api/dashboard` required top-level fields including `total_mes_actual` and decimal string formats in backend/tests/contract/test_dashboard_contract.py
- [X] T016 [P] [US1] Add unit tests for monthly aggregation, current-month total, active-only filtering, zero-data response, and ticket promedio in backend/tests/unit/test_dashboard_service.py
- [X] T017 [P] [US1] Add integration tests for dashboard response with active, annulled, and empty sales in backend/tests/integration/test_dashboard_api.py

### Implementation for User Story 1

- [X] T018 [US1] Implement `VentasPorMesItem` and `DashboardResponse` serializers for monthly totals, current-month total, and ticket promedio in backend/src/api/schemas/dashboard.py
- [X] T019 [US1] Implement active sales query and monthly aggregation by `Venta.creado_en` in backend/src/services/dashboard_service.py
- [X] T020 [US1] Implement total active sales, current-month total, active sale count, zero-state values, and ticket promedio calculation in backend/src/services/dashboard_service.py
- [X] T021 [US1] Wire `GET /api/dashboard` to `get_dashboard` service and response model in backend/src/api/routes/dashboard.py
- [X] T022 [US1] Add frontend types for monthly items, total sales, current-month total, and ticket promedio in frontend/src/types/dashboard.ts
- [X] T023 [US1] Implement dashboard loading, error, and empty states in frontend/src/pages/DashboardPage.tsx
- [X] T024 [US1] Render total sales, current-month total, active sale count, ticket promedio, and monthly sales chart with Recharts in frontend/src/pages/DashboardPage.tsx
- [X] T025 [US1] Mount DashboardPage as the primary dashboard view in frontend/src/App.tsx
- [X] T026 [US1] Run US1 backend tests with `pytest backend/tests/unit/test_dashboard_service.py backend/tests/contract/test_dashboard_contract.py backend/tests/integration/test_dashboard_api.py`

**Checkpoint**: User Story 1 is independently usable as the MVP dashboard.

---

## Phase 4: User Story 2 - Analizar ventas por empresa (Priority: P2)

**Goal**: Users can compare active sales grouped by company and identify which company concentrates more volume.

**Independent Test**: Seed active sales for multiple `Venta.empresa` values plus annulled sales, call `GET /api/dashboard`, and verify company totals exclude annulled sales and match total active sales.

### Tests for User Story 2

- [X] T027 [P] [US2] Add contract tests for `ventas_por_empresa` item shape and required fields in backend/tests/contract/test_dashboard_contract.py
- [X] T028 [P] [US2] Add unit tests for company aggregation, sorting, and annulled-sale exclusion in backend/tests/unit/test_dashboard_service.py
- [X] T029 [P] [US2] Add integration tests for dashboard company breakdown with multiple companies in backend/tests/integration/test_dashboard_api.py

### Implementation for User Story 2

- [X] T030 [US2] Add `VentasPorEmpresaItem` schema and include `ventas_por_empresa` in DashboardResponse in backend/src/api/schemas/dashboard.py
- [X] T031 [US2] Implement active sales aggregation by `Venta.empresa` in backend/src/services/dashboard_service.py
- [X] T032 [US2] Ensure company aggregate totals reconcile with `total_ventas` for active sales in backend/src/services/dashboard_service.py
- [X] T033 [US2] Add frontend types for `ventas_por_empresa` in frontend/src/types/dashboard.ts
- [X] T034 [US2] Render company sales chart and top-company summary in frontend/src/pages/DashboardPage.tsx
- [X] T035 [US2] Run US2 backend tests with `pytest backend/tests/unit/test_dashboard_service.py backend/tests/contract/test_dashboard_contract.py backend/tests/integration/test_dashboard_api.py`

**Checkpoint**: User Story 2 works independently after the base dashboard exists and does not require payment-method visuals.

---

## Phase 5: User Story 3 - Comparar metodos de pago (Priority: P3)

**Goal**: Users can compare payment methods by amount and count, including mixed-payment sales without duplicating sale totals.

**Independent Test**: Seed active sales with multiple `Pago.medio` values and one mixed-payment sale, call `GET /api/dashboard`, and verify each payment amount contributes only to its own method.

### Tests for User Story 3

- [X] T036 [P] [US3] Add contract tests for `metodos_pago` item shape and percentage format in backend/tests/contract/test_dashboard_contract.py
- [X] T037 [P] [US3] Add unit tests for payment-method aggregation, mixed-payment sales, percentages, and active-sale filtering in backend/tests/unit/test_dashboard_service.py
- [X] T038 [P] [US3] Add integration tests for dashboard payment-method breakdown with mixed payments in backend/tests/integration/test_dashboard_api.py

### Implementation for User Story 3

- [X] T039 [US3] Add `MetodoPagoDashboardItem` schema and include `metodos_pago` in DashboardResponse in backend/src/api/schemas/dashboard.py
- [X] T040 [US3] Implement payment-method aggregation from `Pago.medio` and `Pago.monto` joined to active sales in backend/src/services/dashboard_service.py
- [X] T041 [US3] Implement payment-method percentage calculation with zero-total handling in backend/src/services/dashboard_service.py
- [X] T042 [US3] Add frontend types for `metodos_pago` in frontend/src/types/dashboard.ts
- [X] T043 [US3] Render payment-method chart and payment-method table in frontend/src/pages/DashboardPage.tsx
- [X] T044 [US3] Run US3 backend tests with `pytest backend/tests/unit/test_dashboard_service.py backend/tests/contract/test_dashboard_contract.py backend/tests/integration/test_dashboard_api.py`

**Checkpoint**: User Story 3 completes the dashboard indicators from the specification.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation alignment, and regression checks across the dashboard.

- [X] T045 [P] Update frontend README or usage notes for the dashboard route and Recharts dependency in frontend/README.md
- [X] T046 [P] Update backend README with `GET /api/dashboard` summary in backend/README.md
- [X] T047 [P] Review OpenAPI contract alignment against specs/008-dashboard-negocio/contracts/openapi.yaml
- [X] T048 Run quickstart validation commands from specs/008-dashboard-negocio/quickstart.md
- [X] T049 Add service or integration performance assertion for normal operational dashboard volume in backend/tests/integration/test_dashboard_api.py
- [X] T050 Run complete backend regression suite with `pytest backend/tests`
- [X] T051 Run frontend validation with `npm run build` from frontend/
- [ ] T052 Verify dashboard layout manually in desktop browser for non-empty and empty data states in frontend/src/pages/DashboardPage.tsx

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational; delivers MVP dashboard with monthly totals, current-month total, and ticket promedio.
- **US2 (Phase 4)**: Depends on US1 base dashboard response and page; adds company breakdown.
- **US3 (Phase 5)**: Depends on US1 base dashboard response and page; can be implemented after US1 and does not require US2.
- **Polish (Phase 6)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: No dependency on other stories after Foundational; MVP.
- **User Story 2 (P2)**: Requires US1 dashboard foundation; independent from US3.
- **User Story 3 (P3)**: Requires US1 dashboard foundation; independent from US2.

### Parallel Opportunities

- T002 through T007 can run in parallel because they create separate files.
- T008 through T011 can run in parallel before route registration and route shell wiring.
- US1 test tasks T015, T016, and T017 can run in parallel before implementation.
- US2 test tasks T027, T028, and T029 can run in parallel after US1 is stable.
- US3 test tasks T036, T037, and T038 can run in parallel after US1 is stable.
- US2 and US3 can be implemented in parallel by coordinating edits to backend/src/api/schemas/dashboard.py, backend/src/services/dashboard_service.py, frontend/src/types/dashboard.ts, and frontend/src/pages/DashboardPage.tsx.
- T045, T046, and T047 can run in parallel during polish.

---

## Parallel Example: User Story 1

```text
Task: "Add contract tests for GET /api/dashboard required top-level fields including total_mes_actual and decimal string formats in backend/tests/contract/test_dashboard_contract.py"
Task: "Add unit tests for monthly aggregation, current-month total, active-only filtering, zero-data response, and ticket promedio in backend/tests/unit/test_dashboard_service.py"
Task: "Add integration tests for dashboard response with active, annulled, and empty sales in backend/tests/integration/test_dashboard_api.py"
```

---

## Parallel Example: User Story 2

```text
Task: "Add contract tests for ventas_por_empresa item shape and required fields in backend/tests/contract/test_dashboard_contract.py"
Task: "Add unit tests for company aggregation, sorting, and annulled-sale exclusion in backend/tests/unit/test_dashboard_service.py"
Task: "Add integration tests for dashboard company breakdown with multiple companies in backend/tests/integration/test_dashboard_api.py"
```

---

## Parallel Example: User Story 3

```text
Task: "Add contract tests for metodos_pago item shape and percentage format in backend/tests/contract/test_dashboard_contract.py"
Task: "Add unit tests for payment-method aggregation, mixed-payment sales, percentages, and active-sale filtering in backend/tests/unit/test_dashboard_service.py"
Task: "Add integration tests for dashboard payment-method breakdown with mixed payments in backend/tests/integration/test_dashboard_api.py"
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1.
3. Validate `GET /api/dashboard` and the dashboard page for monthly totals, current-month total, total sales, active count, ticket promedio, and empty state.
4. Stop for review if only core indicators are needed.

### Incremental Delivery

1. Deliver US1 monthly sales, current-month total, and ticket promedio.
2. Deliver US2 company breakdown and top-company summary.
3. Deliver US3 payment-method distribution.
4. Complete polish, quickstart validation, backend regression tests, and frontend build.

### Notes

- Keep all business calculations in backend/src/services/dashboard_service.py.
- Do not add persistent dashboard tables, filters, predictions, alerts, or cloud dependencies in this feature.
- Keep frontend charts presentational; do not recompute totals in frontend/src/pages/DashboardPage.tsx.
- Preserve report/export behavior while adding dashboard reads.

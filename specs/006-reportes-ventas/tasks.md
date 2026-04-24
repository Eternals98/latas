# Tasks: Reportes de Ventas

**Input**: Design documents from `/specs/006-reportes-ventas/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Se incluyen pruebas automatizadas porque el plan define pytest unit/integration/contract y los contratos exponen endpoints nuevos de consulta/exportacion.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
Prefer focused, single-thread execution of high-priority work; only mark `[P]` when true file-level independence exists.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`, `frontend/src/`
- Esta feature es backend-first; frontend se limita a tipos/cliente HTTP para consumir reportes si se integra una UI posterior.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar dependencias y archivos base para reportes/exportacion sin cambiar modelos persistidos.

- [X] T001 Add `openpyxl` dependency for XLSX generation in `backend/requirements.txt`
- [X] T002 Create report contract test file scaffold in `backend/tests/contract/test_ventas_reportes_contract.py`
- [X] T003 Create report integration test file scaffold in `backend/tests/integration/test_ventas_reportes.py`
- [X] T004 Create report service unit test file scaffold in `backend/tests/unit/test_ventas_reportes_service.py`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Definir DTOs, validadores y helpers compartidos por consulta mensual, resumen y exportacion.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Define report response schemas `ClienteReporte`, `PagoReporteItem`, `VentaReporteItem`, `ResumenMensualVentas` and `VentasMensualesResponse` in `backend/src/api/schemas/ventas.py`
- [X] T006 Define reusable query validation helpers for `mes`, `anio`, `tipo` and active-state report scope in `backend/src/services/ventas_service.py`
- [X] T007 Implement portable month range helper using start-inclusive/end-exclusive dates in `backend/src/services/ventas_service.py`
- [X] T008 Implement reusable venta-to-report DTO mapper including cliente and pagos in `backend/src/api/schemas/ventas.py`
- [X] T009 [P] Add report/export TypeScript types in `frontend/src/types/venta.ts`
- [X] T010 [P] Add `listVentasByMonth` and `exportVentas` client functions in `frontend/src/services/ventasApi.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order

---

## Phase 3: User Story 1 - Consultar ventas de un mes (Priority: P1) 🎯 MVP

**Goal**: Permitir consultar ventas por `mes` y `anio`, devolviendo solo ventas del periodo solicitado.

**Independent Test**: Crear ventas activas en meses distintos y una venta anulada en el mes consultado, ejecutar `GET /api/ventas?mes=4&anio=2026` y verificar que solo aparecen ventas activas de abril de 2026; un mes sin datos retorna lista vacia.

### Tests for User Story 1

- [X] T011 [P] [US1] Add contract test for `GET /api/ventas` query params and response shape in `backend/tests/contract/test_ventas_reportes_contract.py`
- [X] T012 [US1] Add integration test for monthly filtering across month boundaries and exclusion of annulled ventas in `backend/tests/integration/test_ventas_reportes.py`
- [X] T013 [US1] Add integration test for empty month returning `items: []` in `backend/tests/integration/test_ventas_reportes.py`
- [X] T014 [P] [US1] Add unit tests for month range calculation and invalid period rejection in `backend/tests/unit/test_ventas_reportes_service.py`

### Implementation for User Story 1

- [X] T015 [US1] Implement `list_ventas_by_month` query with `estado=activo` and `selectinload` for cliente/pagos in `backend/src/services/ventas_service.py`
- [X] T016 [US1] Implement `GET /api/ventas?mes=&anio=` route handler returning `VentasMensualesResponse` in `backend/src/api/routes/ventas.py`
- [X] T017 [US1] Return standardized HTTP 400 errors for missing or invalid `mes`/`anio` in `backend/src/api/routes/ventas.py`
- [X] T018 [US1] Ensure the existing `POST /api/ventas` behavior remains unchanged while adding GET in `backend/src/api/routes/ventas.py`

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Revisar ventas agrupadas por mes (Priority: P1)

**Goal**: Incluir resumen mensual con cantidad de ventas y valor total acumulado para el periodo consultado.

**Independent Test**: Consultar un mes con varias ventas y verificar que `resumen_mensual.cantidad_ventas` y `resumen_mensual.valor_total` coinciden con las filas retornadas.

### Tests for User Story 2

- [X] T019 [US2] Add integration test for `resumen_mensual` count and total in `backend/tests/integration/test_ventas_reportes.py`
- [X] T020 [P] [US2] Add unit test for monthly summary calculation with Decimal totals in `backend/tests/unit/test_ventas_reportes_service.py`

### Implementation for User Story 2

- [X] T021 [US2] Implement `build_monthly_summary` helper in `backend/src/services/ventas_service.py`
- [X] T022 [US2] Wire `resumen_mensual` into `list_ventas_by_month` result in `backend/src/services/ventas_service.py`
- [X] T023 [US2] Serialize summary totals as two-decimal strings in `backend/src/api/schemas/ventas.py`

**Checkpoint**: User Stories 1 and 2 should work independently with filtered rows and monthly summary

---

## Phase 5: User Story 3 - Exportar ventas formales o informales (Priority: P2)

**Goal**: Generar archivo XLSX simple separado por `tipo=formal|informal`, opcionalmente limitado por `mes` y `anio`.

**Independent Test**: Ejecutar exportacion formal e informal para el mismo mes, abrir o inspeccionar ambos XLSX y verificar que cada archivo contiene solo ventas activas del tipo solicitado con encabezados simples.

### Tests for User Story 3

- [X] T024 [P] [US3] Add contract test for `GET /api/ventas/export` parameters and XLSX response media type in `backend/tests/contract/test_ventas_reportes_contract.py`
- [X] T025 [US3] Add integration test for formal export containing only active formal ventas in `backend/tests/integration/test_ventas_reportes.py`
- [X] T026 [US3] Add integration test for informal export containing only active informal ventas in `backend/tests/integration/test_ventas_reportes.py`
- [X] T027 [US3] Add integration test for invalid export `tipo` returning HTTP 400 in `backend/tests/integration/test_ventas_reportes.py`
- [X] T028 [P] [US3] Add unit test for XLSX workbook headers and row values in `backend/tests/unit/test_ventas_reportes_service.py`

### Implementation for User Story 3

- [X] T029 [US3] Implement `list_ventas_for_export` filtering by `estado=activo`, `tipo` and optional `mes`/`anio` in `backend/src/services/ventas_service.py`
- [X] T030 [US3] Implement simple XLSX workbook generation with required columns in `backend/src/services/ventas_service.py`
- [X] T031 [US3] Implement `GET /api/ventas/export?tipo=formal|informal` route returning `StreamingResponse` or file response in `backend/src/api/routes/ventas.py`
- [X] T032 [US3] Set XLSX `Content-Type` and `Content-Disposition` filename for exports in `backend/src/api/routes/ventas.py`
- [X] T033 [US3] Validate partial period params so export rejects only one of `mes` or `anio` in `backend/src/services/ventas_service.py`
- [X] T034 [US3] Ensure export handles no matching ventas with a valid header-only workbook in `backend/src/services/ventas_service.py`
- [X] T035 [US3] Add export coverage for special characters and long descriptions in `backend/tests/integration/test_ventas_reportes.py`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cierre de documentacion, verificacion local y proteccion de comportamiento existente.

- [X] T036 [P] Update backend usage notes for monthly report and export endpoints in `backend/README.md`
- [X] T037 [P] Update final verification evidence and commands in `specs/006-reportes-ventas/quickstart.md`
- [X] T038 Add performance smoke test for monthly listing/export thresholds in `backend/tests/integration/test_ventas_performance.py`
- [X] T039 Run backend test suite and record final result in `specs/006-reportes-ventas/research.md`
- [X] T040 Run frontend build after TypeScript API changes and document result in `specs/006-reportes-ventas/quickstart.md`
- [X] T041 Verify generated OpenAPI includes both `GET /api/ventas` and `GET /api/ventas/export` without regressing `POST /api/ventas` in `backend/tests/contract/test_ventas_reportes_contract.py`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1 result shape because summary is part of monthly listing
- **User Story 3 (Phase 5)**: Depends on Foundational validation helpers and can reuse US1 filtering helpers
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: MVP. Can start after Foundational.
- **User Story 2 (P1)**: Builds on US1 monthly response by adding/verifying `resumen_mensual`.
- **User Story 3 (P2)**: Can start after Foundational, but should reuse date/type validation and query helpers from US1.

### Within Each User Story

- Tests should be written before implementation and fail first
- Service helpers before route handlers
- Schema/serialization before endpoint response assertions
- Endpoint behavior before documentation updates
- Complete each story checkpoint before moving to the next priority

### Parallel Opportunities

- Setup: T002, T003 and T004 can be prepared independently after T001
- Foundational: T009 and T010 can run in parallel with backend schema/service helper work
- US1: T011 and T014 can be authored in parallel because they target different files
- US2: T019 and T020 should be sequenced if avoiding same-feature test churn, even though they target different files
- US3: T024 and T028 can be authored in parallel because they target different files
- Polish: T036 and T037 can run in parallel

---

## Parallel Example: User Story 1

```bash
Task: "T011 [US1] Add contract test for GET /api/ventas in backend/tests/contract/test_ventas_reportes_contract.py"
Task: "T014 [US1] Add unit tests for month range calculation in backend/tests/unit/test_ventas_reportes_service.py"
```

## Parallel Example: User Story 3

```bash
Task: "T024 [US3] Add contract test for GET /api/ventas/export in backend/tests/contract/test_ventas_reportes_contract.py"
Task: "T028 [US3] Add unit test for XLSX workbook headers in backend/tests/unit/test_ventas_reportes_service.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: run `curl "http://localhost:8000/api/ventas?mes=4&anio=2026"` and related pytest tests
5. Demo monthly list before adding summary/export refinements

### Incremental Delivery

1. Setup + Foundational
2. Add US1 monthly list -> test independently -> demo MVP
3. Add US2 monthly summary -> test independently -> demo totals
4. Add US3 formal/informal export -> test independently -> demo XLSX files
5. Polish documentation, performance smoke and full test execution

### Focused Team Strategy

1. Keep backend route/service changes sequential to avoid same-file conflicts
2. Parallelize test authoring where files or concerns are independent
3. Parallelize frontend type/client additions with backend foundational work
4. Finish each checkpoint before expanding scope to the next story

---

## Notes

- [P] tasks = different files or independent test concerns with no dependency on incomplete implementation
- [Story] label maps task to a specific user story for traceability
- Existing `POST /api/ventas` behavior must remain compatible throughout
- Advanced Excel formatting, charts, formulas and dashboard work are out of scope for this task list

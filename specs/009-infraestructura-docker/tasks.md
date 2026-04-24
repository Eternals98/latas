# Tasks: Infraestructura Docker

**Input**: Design documents from `/specs/009-infraestructura-docker/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/deployment.md, quickstart.md

**Tests**: No TDD/test-first workflow was requested. Validation is covered through build, Compose, proxy health, and quickstart verification tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Each task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the deployment files and shared configuration needed by all stories.

- [X] T001 Review existing Docker and runtime assumptions in `docker-compose.yml`, `backend/Dockerfile`, `frontend/package.json`, and `frontend/src/services/httpClient.ts`
- [X] T002 [P] Create frontend container build file in `frontend/Dockerfile`
- [X] T003 [P] Create frontend static server configuration in `frontend/nginx.conf`
- [X] T004 [P] Create proxy configuration directory and base file in `nginx/conf.d/default.conf`
- [X] T005 [P] Add non-secret backend runtime defaults in `backend/.env.example`
- [X] T006 Update `.dockerignore` so Docker builds include required Dockerfiles and nginx configuration while excluding local data and dependency folders

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the shared deployment contract before implementing user-facing stories.

**CRITICAL**: No user story work should begin until this phase is complete.

- [X] T007 Replace the current backend-only composition with `proxy`, `frontend`, and `backend` services in `docker-compose.yml`
- [X] T008 Configure backend persistence and environment wiring for local SQLite in `docker-compose.yml`
- [X] T009 Configure service dependencies, restart behavior, and health checks for `backend` and `proxy` in `docker-compose.yml`
- [X] T010 Update backend CORS/local origin settings for `ventas.local` in `backend/src/api/main.py`
- [X] T011 Ensure the documented deployment contract maps `/`, `/assets/*`, and `/api/*` consistently between `docker-compose.yml` and `nginx/conf.d/default.conf`

**Checkpoint**: Foundation ready. Compose structure, proxy routing, persistence, and local origin assumptions are defined.

---

## Phase 3: User Story 1 - Levantar el sistema completo localmente (Priority: P1) MVP

**Goal**: Start frontend, backend, and proxy as one reproducible local deployment.

**Independent Test**: From the repository root, run the documented Compose start command and verify the services are up and the application is reachable through the proxy.

### Implementation for User Story 1

- [X] T012 [US1] Implement backend service build, command, environment, volume, and internal network configuration in `docker-compose.yml`
- [X] T013 [US1] Implement frontend service build and internal exposure in `docker-compose.yml`
- [X] T014 [US1] Implement proxy service exposure and dependency wiring in `docker-compose.yml`
- [X] T015 [US1] Finalize frontend production build and static serving behavior in `frontend/Dockerfile` and `frontend/nginx.conf`
- [X] T016 [US1] Configure proxy routing from public `/` to frontend and `/api/` to backend in `nginx/conf.d/default.conf`
- [X] T017 [US1] Validate local startup instructions against `specs/009-infraestructura-docker/quickstart.md` and update any command mismatch in `specs/009-infraestructura-docker/quickstart.md`

**Checkpoint**: User Story 1 is complete when `docker compose up --build` starts all required components and the frontend can be opened through the proxy.

---

## Phase 4: User Story 2 - Acceder mediante ventas.local (Priority: P2)

**Goal**: Let users access the app through `http://ventas.local` and keep API calls behind the same local entrypoint.

**Independent Test**: After adding the hosts entry, open `http://ventas.local` and verify frontend operations call `/api` through the proxy.

### Implementation for User Story 2

- [X] T018 [US2] Update default API base handling to prefer same-origin `/api` in `frontend/src/services/httpClient.ts`
- [X] T019 [US2] Update export URL generation to use the shared API base instead of hardcoded localhost in `frontend/src/services/ventasApi.ts`
- [X] T020 [US2] Configure `server_name ventas.local` and SPA fallback behavior in `nginx/conf.d/default.conf`
- [X] T021 [US2] Document Windows and Unix-like hosts file edits for `ventas.local` in `docs/docker-local.md`
- [X] T022 [US2] Add `ventas.local` access and API health verification steps to `docs/docker-local.md`

**Checkpoint**: User Story 2 is complete when users can operate through `http://ventas.local` without entering frontend or backend ports.

---

## Phase 5: User Story 3 - Diagnosticar el despliegue local (Priority: P3)

**Goal**: Provide clear verification, troubleshooting, and shutdown guidance for the local deployment.

**Independent Test**: Simulate a missing hosts entry or stopped service and confirm the documentation leads to the correct diagnosis.

### Implementation for User Story 3

- [X] T023 [US3] Add start, stop, restart, rebuild, status, and log inspection commands to `docs/docker-local.md`
- [X] T024 [US3] Document troubleshooting for host resolution, occupied proxy port, backend unavailable, and stale frontend build in `docs/docker-local.md`
- [X] T025 [US3] Add quick health-check commands for `http://ventas.local/api/health` and `docker compose ps` to `docs/docker-local.md`
- [X] T026 [US3] Document offline-prepared operation expectations, including first-build dependency preparation and what works without internet, in `docs/docker-local.md`
- [X] T027 [US3] Cross-link operational documentation from `README.md` to `docs/docker-local.md`

**Checkpoint**: User Story 3 is complete when a responsible technical user can diagnose common local deployment failures using repository documentation only.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full deployment contract and keep documentation aligned with implementation.

- [X] T028 [P] Run frontend quality checks with `npm run build` and `npm run lint` from `frontend/`
- [X] T029 [P] Run backend health-related test coverage with `pytest backend/tests/integration/test_health.py` from repository root
- [X] T030 Validate Docker Compose configuration with `docker compose config` from repository root
- [X] T031 Validate the full quickstart flow with `docker compose up --build`, `http://ventas.local`, and `http://ventas.local/api/health`
- [X] T032 Validate three consecutive `docker compose down` / `docker compose up` restart cycles keep `http://ventas.local` and `http://ventas.local/api/health` working
- [X] T033 Update `specs/009-infraestructura-docker/quickstart.md` if implementation commands or verification outputs changed during validation
- [X] T034 Review `specs/009-infraestructura-docker/contracts/deployment.md` against final `docker-compose.yml`, `nginx/conf.d/default.conf`, and `docs/docker-local.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; can start immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational; delivers MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational and benefits from US1 proxy/frontend/backend services.
- **User Story 3 (Phase 5)**: Depends on Foundational and should reflect the final US1/US2 operational behavior.
- **Polish (Phase 6)**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1 - Levantar el sistema completo localmente**: First delivery target after foundation.
- **US2 - Acceder mediante ventas.local**: Can start after foundation, but final validation depends on US1 routing working.
- **US3 - Diagnosticar el despliegue local**: Can draft after foundation, but should be finalized after US1 and US2 behavior is known.

### Parallel Opportunities

- T002, T003, T004, and T005 can run in parallel because they create independent files.
- T012, T013, and T014 touch the same file and should be coordinated sequentially.
- T018 and T020 can run in parallel after foundation because they touch different files.
- T021, T022, T023, T024, T025, and T026 all touch `docs/docker-local.md`; keep them sequential or assign a single owner.
- T028 and T029 can run in parallel after implementation because they validate separate frontend/backend surfaces.

---

## Parallel Example: User Story 2

```text
Task: "T018 [US2] Update default API base handling to prefer same-origin /api in frontend/src/services/httpClient.ts"
Task: "T020 [US2] Configure server_name ventas.local and SPA fallback behavior in nginx/conf.d/default.conf"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup files.
2. Complete Phase 2 shared Compose, proxy, persistence, and origin configuration.
3. Complete Phase 3 for a reproducible local deployment.
4. Stop and validate `docker compose up --build` plus proxy access before adding host-specific workflow.

### Incremental Delivery

1. Deliver US1: services start together behind proxy.
2. Deliver US2: `ventas.local` and same-origin API calls work.
3. Deliver US3: documentation supports diagnosis, shutdown, restart, and common failures.
4. Run Phase 6 validation and align quickstart/contract docs.

### Single-Owner Guidance

`docker-compose.yml`, `nginx/conf.d/default.conf`, and `docs/docker-local.md` are coordination hotspots. Prefer one active editor per file during implementation to avoid conflicting task work.

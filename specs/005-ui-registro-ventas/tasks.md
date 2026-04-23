# Tasks: UI Registro de Ventas

**Input**: Design documents from `/specs/005-ui-registro-ventas/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Esta fase prioriza implementacion funcional + validacion medible operativa (manual guiada). Las pruebas automatizadas frontend quedan fuera de alcance en esta iteracion.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
Prefer focused, single-thread execution of high-priority work; only mark `[P]` when true file-level independence exists.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app paths: `backend/src/`, `frontend/src/`, `frontend/tests/`
- Esta feature implementa UI en `frontend/` consumiendo contratos existentes en `backend/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicializar frontend React + Vite + Tailwind y estructura base del modulo de ventas.

- [X] T001 Crear aplicacion React + Vite TypeScript en `frontend/` con configuracion inicial en `frontend/package.json`
- [X] T002 Configurar Tailwind en `frontend/tailwind.config.js`, `frontend/postcss.config.js` y `frontend/src/index.css`
- [X] T003 Crear archivo de entorno base `frontend/.env.example` con `VITE_API_URL`
- [X] T004 Crear estructura de carpetas del feature en `frontend/src/pages`, `frontend/src/components/venta`, `frontend/src/services`, `frontend/src/hooks`, `frontend/src/types`, `frontend/src/utils` y `frontend/src/constants`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Base comun para habilitar implementacion independiente por historia.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Definir tipos de dominio compartidos en `frontend/src/types/venta.ts`
- [X] T006 Crear cliente HTTP base y manejo de errores en `frontend/src/services/httpClient.ts`
- [X] T007 [P] Implementar servicio de clientes en `frontend/src/services/clientesApi.ts`
- [X] T008 [P] Implementar servicio de medios de pago en `frontend/src/services/mediosPagoApi.ts`
- [X] T009 Implementar servicio de ventas en `frontend/src/services/ventasApi.ts`
- [X] T010 [P] Implementar utilidades monetarias (`parse`, `format`, `sum`, `equals`) en `frontend/src/utils/money.ts`
- [X] T011 Crear constantes de opciones de empresa/tipo alineadas a contrato en `frontend/src/constants/ventaOptions.ts`
- [X] T012 Crear shell base de pantalla de registro en `frontend/src/pages/RegistroVentasPage.tsx`
- [X] T013 Crear hook base compartido de formulario en `frontend/src/hooks/useRegistroVentaForm.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Registrar venta completa en una sola vista (Priority: P1) 🎯 MVP

**Goal**: Permitir registrar una venta completa con campos requeridos, cliente por autocomplete y envio exitoso en una sola vista.

**Independent Test**: Completar empresa, tipo, referencia, descripcion, cliente, telefono, valor total y un pago valido; enviar y verificar creacion `201`.

### Implementation for User Story 1

- [X] T014 [P] [US1] Implementar componente de campos principales en `frontend/src/components/venta/VentaFormFields.tsx`
- [X] T015 [US1] Implementar carga de sugerencias de clientes para autocomplete en `frontend/src/hooks/useRegistroVentaForm.ts`
- [X] T016 [US1] Implementar autocompletado de telefono al seleccionar cliente en `frontend/src/hooks/useRegistroVentaForm.ts`
- [X] T017 [US1] Integrar campos + estado base en `frontend/src/pages/RegistroVentasPage.tsx`
- [X] T018 [US1] Conectar envio de formulario con `POST /api/ventas` en `frontend/src/pages/RegistroVentasPage.tsx`
- [X] T019 [US1] Integrar pagina en entrada de app y ruta principal en `frontend/src/main.tsx` y `frontend/src/App.tsx`
- [X] T020 [US1] Mostrar feedback de exito/error de envio y preservar datos en `frontend/src/pages/RegistroVentasPage.tsx`

**Checkpoint**: User Story 1 funcional y verificable de forma independiente

---

## Phase 4: User Story 2 - Gestionar multiples formas de pago dinamicamente (Priority: P1)

**Goal**: Permitir agregar, editar y eliminar filas de pago en tabla editable conservando datos capturados.

**Independent Test**: Crear venta con 2+ filas, editar montos, eliminar una fila y confirmar recálculo en UI sin recargar.

### Implementation for User Story 2

- [X] T021 [P] [US2] Crear componente de fila editable de pago en `frontend/src/components/venta/PagoRow.tsx`
- [X] T022 [US2] Crear tabla dinamica de pagos con acciones de agregar/eliminar en `frontend/src/components/venta/PagosTable.tsx`
- [X] T023 [US2] Extender `useRegistroVentaForm` para gestionar `PagoDraft[]` en `frontend/src/hooks/useRegistroVentaForm.ts`
- [X] T024 [US2] Inicializar una fila de pago por defecto al abrir el formulario en `frontend/src/hooks/useRegistroVentaForm.ts`
- [X] T025 [US2] Cargar opciones reales de medios de pago desde `mediosPagoApi` en `frontend/src/components/venta/PagosTable.tsx`
- [X] T026 [US2] Preservar datos existentes al agregar/eliminar filas en `frontend/src/hooks/useRegistroVentaForm.ts`
- [X] T027 [US2] Integrar tabla de pagos en `frontend/src/pages/RegistroVentasPage.tsx`

**Checkpoint**: User Story 2 funcional y verificable de forma independiente

---

## Phase 5: User Story 3 - Validar consistencia entre total y pagos antes de guardar (Priority: P1)

**Goal**: Mostrar estado visual OK/error del cuadre de pagos y bloquear envio cuando exista discrepancia.

**Independent Test**: Forzar descuadre, verificar indicador de error, corregir montos y verificar cambio inmediato a estado OK.

### Implementation for User Story 3

- [X] T028 [US3] Implementar calculo reactivo de suma de pagos y estado de cuadre en `frontend/src/hooks/useRegistroVentaForm.ts`
- [X] T029 [P] [US3] Crear componente de indicador visual de cuadre en `frontend/src/components/venta/PaymentBalanceIndicator.tsx`
- [X] T030 [US3] Integrar indicador visual en `frontend/src/pages/RegistroVentasPage.tsx`
- [X] T031 [US3] Bloquear accion de guardar cuando `isBalanced` sea falso en `frontend/src/pages/RegistroVentasPage.tsx`
- [X] T032 [US3] Mostrar mensaje accionable de discrepancia junto a total/pagos en `frontend/src/components/venta/PaymentBalanceIndicator.tsx`

**Checkpoint**: User Story 3 funcional y verificable de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Ajustes de usabilidad, verificacion medible de criterios de exito y documentacion de entrega.

- [X] T033 [P] Mejorar accesibilidad y foco de teclado en `frontend/src/components/venta/VentaFormFields.tsx` y `frontend/src/components/venta/PagoRow.tsx`
- [X] T034 Ajustar estados de carga para clientes/medios de pago/envio en `frontend/src/pages/RegistroVentasPage.tsx`
- [ ] T035 Ejecutar protocolo medible SC-001 (tiempo de registro) y documentar resultados en `specs/005-ui-registro-ventas/quickstart.md`
- [ ] T036 Ejecutar protocolo medible SC-003 (ventas mixtas sin correccion) y documentar resultados en `specs/005-ui-registro-ventas/quickstart.md`
- [ ] T037 Verificar SC-002 con casos de cuadre/no-cuadre y documentar evidencia en `specs/005-ui-registro-ventas/quickstart.md`
- [X] T038 Actualizar guia operativa para flujo UI registro ventas en `backend/README.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Cada historia depende solo de Phase 2
- **Polish (Phase 6)**: Depends on completion of stories in scope

### User Story Dependencies

- **US1**: Puede iniciar tras Phase 2
- **US2**: Puede iniciar tras Phase 2
- **US3**: Puede iniciar tras Phase 2

### Within Each User Story

- Estado/hook antes de integracion completa en pagina
- Componentes antes de wiring final en pantalla
- Implementacion base antes de verificacion manual independiente

### Parallel Opportunities

- Phase 2: T007, T008 y T010 pueden ejecutarse en paralelo
- US1: T014 puede avanzar en paralelo con T015
- US2: T021 puede avanzar en paralelo con T023
- US3: T029 puede avanzar en paralelo con T028

---

## Parallel Example: User Story 1

```bash
Task: "T014 [US1] Implementar campos principales en frontend/src/components/venta/VentaFormFields.tsx"
Task: "T015 [US1] Implementar autocomplete de clientes en frontend/src/hooks/useRegistroVentaForm.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validar flujo de registro simple con un pago

### Incremental Delivery

1. Entregar US1 para captura y envio base
2. Entregar US2 para pagos multiples dinamicos
3. Entregar US3 para validacion visual y bloqueo por descuadre
4. Ejecutar Phase 6 para verificar SC medibles y cerrar documentacion

### Focused Execution Strategy

1. Resolver una tarea a la vez dentro de cada fase
2. Evitar multitarea entre historias hasta cerrar checkpoint
3. Usar tareas `[P]` solo cuando hay independencia real de archivos

---

## Notes

- Todas las tareas siguen formato obligatorio `- [ ] TXXX [P?] [US?] Descripcion con ruta`
- Se corrigio cobertura explicita de autocompletado de telefono (FR-004) y fila inicial de pago (FR-006)
- Se agregaron tareas de medicion para SC-001, SC-002 y SC-003


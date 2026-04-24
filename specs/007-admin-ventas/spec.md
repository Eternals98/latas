# Feature Specification: Administracion de Ventas

**Feature Branch**: `007-admin-ventas`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "Feature: Administracion. Objetivo: Permitir edicion y anulacion de ventas. Seguridad: Endpoint POST /api/admin/login. Genera JWT (8h). Endpoints protegidos: PUT /api/ventas/{id}; DELETE /api/ventas/{id} (anulacion logica). Reglas: No borrar fisicamente; Cambiar estado = anulado"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acceso administrativo seguro (Priority: P1)

Un administrador necesita iniciar sesion para obtener autorizacion temporal antes de realizar cambios sensibles sobre ventas registradas.

**Why this priority**: Sin acceso administrativo protegido, la edicion y anulacion de ventas puede exponer operaciones criticas a usuarios no autorizados.

**Independent Test**: Puede probarse solicitando acceso con credenciales administrativas validas e invalidas y verificando que solo las credenciales validas habilitan operaciones protegidas durante la ventana permitida.

**Acceptance Scenarios**:

1. **Given** credenciales administrativas validas, **When** el administrador solicita inicio de sesion en `POST /api/admin/login`, **Then** recibe una autorizacion temporal con vigencia de 8 horas.
2. **Given** credenciales invalidas o incompletas, **When** se solicita inicio de sesion administrativo, **Then** el sistema rechaza el acceso y no emite autorizacion.
3. **Given** una autorizacion vencida, **When** el administrador intenta editar o anular una venta, **Then** el sistema rechaza la operacion y solicita nuevo inicio de sesion.

---

### User Story 2 - Editar ventas registradas (Priority: P2)

Un administrador necesita corregir datos de una venta existente cuando se detectan errores operativos, manteniendo la identidad de la venta y la trazabilidad del cambio.

**Why this priority**: La correccion controlada evita duplicar ventas o modificar datos directamente fuera del sistema.

**Independent Test**: Puede probarse autenticando a un administrador, actualizando una venta activa mediante `PUT /api/ventas/{id}` y verificando que los datos permitidos cambian sin alterar el identificador ni el historial minimo requerido.

**Acceptance Scenarios**:

1. **Given** una venta activa existente y autorizacion administrativa vigente, **When** el administrador envia cambios validos a `PUT /api/ventas/{id}`, **Then** la venta queda actualizada y conserva su identificador original.
2. **Given** una venta inexistente, **When** el administrador intenta editarla, **Then** el sistema informa que la venta no existe y no crea una venta nueva.
3. **Given** una venta anulada, **When** el administrador intenta editar sus datos comerciales, **Then** el sistema rechaza la modificacion para preservar el registro de anulacion.
4. **Given** datos invalidos para una venta, **When** el administrador intenta guardarlos, **Then** el sistema rechaza la edicion y conserva los datos previos.

---

### User Story 3 - Anular ventas sin borrado fisico (Priority: P3)

Un administrador necesita anular una venta que no debe seguir contando como activa, sin eliminar su registro de la base historica.

**Why this priority**: La anulacion conserva evidencia operativa y evita perdida de informacion usada por reportes, auditoria y conciliacion.

**Independent Test**: Puede probarse autenticando a un administrador, anulando una venta activa mediante `DELETE /api/ventas/{id}` y verificando que la venta permanece registrada con estado `anulado`.

**Acceptance Scenarios**:

1. **Given** una venta activa existente y autorizacion administrativa vigente, **When** el administrador solicita `DELETE /api/ventas/{id}`, **Then** la venta no se borra fisicamente y su estado cambia a `anulado`.
2. **Given** una venta ya anulada, **When** el administrador solicita su anulacion nuevamente, **Then** el sistema responde de forma consistente sin duplicar efectos ni perder trazabilidad.
3. **Given** una venta anulada, **When** se consultan flujos operativos de ventas activas, **Then** la venta anulada queda excluida de resultados activos y permanece disponible para consulta historica.

### Edge Cases

- Intento de editar o anular una venta sin autorizacion administrativa vigente.
- Intento de editar campos no modificables como identificador, estado de anulacion o marcas de auditoria.
- Intento de anular una venta inexistente.
- Intento de editar una venta con relaciones inconsistentes, como cliente o pagos no validos.
- Expiracion de autorizacion durante una sesion administrativa iniciada.
- Repeticion de una solicitud de anulacion por error del operador o reintento de red.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide administrative login through `POST /api/admin/login` for authorized administrators.
- **FR-002**: System MUST issue administrative authorization with an 8-hour validity period after successful login.
- **FR-003**: System MUST reject administrative login attempts with invalid, missing, or inactive credentials.
- **FR-004**: System MUST require valid administrative authorization for `PUT /api/ventas/{id}` and `DELETE /api/ventas/{id}`.
- **FR-005**: Users MUST be able to update editable data for an existing active sale through the protected sale update operation.
- **FR-006**: System MUST preserve the sale identifier and required traceability fields when a sale is edited.
- **FR-007**: System MUST reject edits for non-existent sales, annulled sales, invalid sale data, or fields that are not allowed to change.
- **FR-008**: Users MUST be able to annul an existing active sale through `DELETE /api/ventas/{id}`.
- **FR-009**: System MUST NOT physically delete a sale when annulment is requested.
- **FR-010**: System MUST change the sale status to `anulado` when annulment succeeds.
- **FR-011**: System MUST keep annulled sales available for historical and traceability use while excluding them from active-sale operational results.
- **FR-012**: System MUST handle repeated annulment requests consistently without creating duplicate records or restoring the sale.
- **FR-013**: System MUST provide clear failure responses when authorization is missing, expired, invalid, or insufficient.

### Constitutional Alignment *(mandatory)*

- **CA-001 Simplicity**: The simplest viable scope is one administrative login flow plus protected update and annulment operations for existing sales. Role management screens, password recovery, and multi-role administration are deferred.
- **CA-002 Domain Model**: Affected entities are `Venta` as the edited or annulled record, `Cliente` when sale ownership data is validated, and `Pago` when payment details are corrected or preserved.
- **CA-003 Backend Rules**: Authorization, sale existence checks, editable-field rules, no physical deletion, and `estado = anulado` are enforced by backend APIs/services.
- **CA-004 Persistence**: Sale updates and annulments must use normal persistence paths compatible with SQLAlchemy and PostgreSQL-style relational behavior while remaining viable for the local database.
- **CA-005 Security**: Editing and annulment are admin-only operations. Administrative authorization is local-first, time-limited to 8 hours, and required for every protected operation.
- **CA-006 Modularity**: Impacted modules are Administracion for login/security and Ventas for update/annulment behavior. Clientes and Pagos are touched only through sale validation. Reportes must respect annulled status.
- **CA-007 UX Productivity**: Administrators can correct or annul sales through direct operations without manual database edits or duplicate replacement sales.
- **CA-008 AI Decoupling**: The feature does not depend on analysis or AI behavior and remains isolated from `/api/analisis`.
- **CA-009 Export Compatibility**: Reporting and export flows must continue to exclude annulled sales from active operational outputs unless a historical view explicitly includes them.
- **CA-010 Deploy Local-First**: The feature must work in the existing LAN/offline deployment model and remain compatible with Docker Compose usage.
- **CA-011 Traceability**: Edited and annulled sales must retain identifiers, status, and change timing sufficient to explain what changed and when.
- **CA-012 Phase Control**: Current phase adds administration for sale editing and logical annulment only. Full admin user management, detailed audit dashboards, and physical purge workflows are out of scope.

### Key Entities *(include if feature involves data)*

- **Administrador**: Authorized operator allowed to perform sensitive sale changes after successful login; represented by credentials and time-limited authorization.
- **Venta**: Existing sale record that can be edited while active or marked as `anulado` without physical deletion.
- **Cliente**: Customer associated with a sale; must remain valid if sale edits change customer-related data.
- **Pago**: Payment information associated with a sale; must remain valid and consistent when sale edits affect payment details.
- **Autorizacion administrativa**: Temporary permission created after successful login and valid for 8 hours.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of protected sale edit and annulment attempts without valid administrative authorization are rejected.
- **SC-002**: Administrators can complete login and receive usable authorization in under 30 seconds with valid credentials.
- **SC-003**: 95% of valid sale corrections can be completed by an administrator in under 2 minutes without creating duplicate sales.
- **SC-004**: 100% of successful annulments leave the original sale record present with status `anulado`.
- **SC-005**: Active-sale operational views and reports exclude annulled sales in 100% of standard active-result checks.
- **SC-006**: Repeating an annulment request for the same sale does not create duplicate records or change the final annulled state in 100% of tested retries.

## Assumptions

- Administrators already have a defined credential source or can be configured locally as part of implementation planning.
- Editable sale data includes normal operational fields such as customer, sale details, totals, and payment information, but excludes immutable identifiers and audit/status fields.
- Annulled sales are not editable through the standard edit operation after annulment.
- Existing sale creation, listing, reporting, and export behavior remains in place and must honor the `anulado` status for active results.
- Authorization is intended for trusted local administrative operators in the existing LAN/offline deployment context.

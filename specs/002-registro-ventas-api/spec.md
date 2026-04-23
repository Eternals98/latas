# Feature Specification: Registro de Ventas API

**Feature Branch**: `[002-registro-ventas-api]`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Feature: Registro de Ventas (API)\n\nObjetivo:\nPermitir crear ventas con multiples formas de pago."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar venta con pagos multiples (Priority: P1)

Como operador de ventas, necesito registrar una venta con una o varias formas de pago para dejar la transaccion completa en un solo flujo.

**Why this priority**: Es el flujo principal de negocio y desbloquea el registro real de ingresos.

**Independent Test**: Enviar una solicitud de creacion de venta con 2 pagos cuya suma sea igual al valor total y verificar que la venta y sus pagos quedan registrados.

**Acceptance Scenarios**:

1. **Given** datos completos de venta y al menos un pago valido, **When** se solicita crear la venta, **Then** se crea la venta con todos los pagos asociados.
2. **Given** una venta creada, **When** se consulta la respuesta de creacion, **Then** se devuelve la venta con su lista completa de pagos.

---

### User Story 2 - Rechazar inconsistencias de montos (Priority: P1)

Como negocio, necesito que el total pagado coincida exactamente con el valor de la venta para evitar descuadres contables.

**Why this priority**: Evita registrar operaciones invalidas que rompen reportes y conciliacion.

**Independent Test**: Enviar una solicitud donde la suma de pagos no coincide con el total y validar rechazo con error de cliente.

**Acceptance Scenarios**:

1. **Given** una solicitud con pagos cuya suma es diferente de `valor_total`, **When** se intenta crear la venta, **Then** el sistema responde con error 400 y no registra datos.
2. **Given** una solicitud con pagos y total consistentes, **When** se procesa la creacion, **Then** no se genera error de consistencia de montos.

---

### User Story 3 - Rechazar datos incompletos obligatorios (Priority: P2)

Como operador, necesito retroalimentacion inmediata cuando faltan datos requeridos para corregir la captura sin ambiguedad.

**Why this priority**: Reduce reprocesos y evita registros parcialmente validos.

**Independent Test**: Enviar solicitudes sin `empresa`, sin `tipo` o sin pagos y validar rechazo con error 400.

**Acceptance Scenarios**:

1. **Given** una solicitud sin `empresa` o sin `tipo`, **When** se procesa la creacion, **Then** el sistema responde con error 400.
2. **Given** una solicitud sin pagos, **When** se procesa la creacion, **Then** el sistema responde con error 400 indicando que debe existir al menos un pago.

### Edge Cases

- `pagos` vacio o ausente debe ser rechazado.
- Un pago con monto menor o igual a cero debe ser rechazado.
- Diferencias de redondeo en montos decimales deben tratarse con precision monetaria consistente.
- `cliente_id` ausente debe permitir la creacion de la venta.
- Si ocurre un error al crear un pago asociado, no debe persistirse la venta parcial.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST exponer el endpoint `POST /api/ventas` para crear ventas.
- **FR-002**: El sistema MUST aceptar en la solicitud los campos `empresa`, `tipo`, `numero_referencia`, `descripcion`, `valor_total`, `cliente_id` opcional y `pagos`.
- **FR-003**: El sistema MUST exigir `empresa` y `tipo` como datos obligatorios.
- **FR-004**: El sistema MUST exigir al menos un elemento en `pagos`.
- **FR-005**: El sistema MUST validar que la suma de `pagos[].monto` sea igual a `valor_total`.
- **FR-006**: El sistema MUST crear la venta principal cuando la validacion sea exitosa.
- **FR-007**: El sistema MUST crear los pagos asociados a la venta en la misma operacion.
- **FR-008**: El sistema MUST ejecutar la creacion de venta y pagos dentro de una transaccion atomica.
- **FR-009**: El sistema MUST devolver error `400` cuando la suma de pagos sea diferente al total.
- **FR-010**: El sistema MUST devolver error `400` cuando falten campos obligatorios o cuando no existan pagos.
- **FR-011**: El sistema MUST responder con la venta creada incluyendo su lista de pagos asociados.
- **FR-012**: El sistema MUST permitir validar el flujo completo mediante pruebas manuales con `curl`.

### Constitutional Alignment *(mandatory)*

- **CA-001 Simplicity**: El alcance se limita a un unico flujo de registro de venta sin agregar complejidad fuera del requerimiento.
- **CA-002 Domain Model**: Se refuerza la relacion de dominio `Venta 1:N Pago` con `cliente_id` opcional.
- **CA-003 Backend Rules**: Las validaciones de consistencia de montos y obligatoriedad se aplican en backend como fuente unica de verdad.
- **CA-004 Persistence**: El feature exige persistencia transaccional para evitar estados parciales en ventas y pagos.
- **CA-005 Security**: No agrega nuevos privilegios administrativos; mantiene el alcance funcional de registro operativo.
- **CA-006 Modularity**: Impacta principalmente el modulo `Ventas` y la vinculacion con `Clientes` via `cliente_id` opcional.
- **CA-007 UX Productivity**: Aporta retroalimentacion clara de errores para acelerar correcciones durante captura operativa.
- **CA-008 AI Decoupling**: No introduce dependencias ni acoplamientos con capacidades de analisis IA.
- **CA-009 Export Compatibility**: Garantiza datos de pago consistentes para futuras exportaciones formal e informal.
- **CA-010 Deploy Local-First**: El flujo debe poder probarse en entorno local mediante solicitudes HTTP directas.
- **CA-011 Traceability**: La venta creada conserva trazabilidad temporal y de estado segun el modelo transaccional existente.
- **CA-012 Phase Control**: Este alcance corresponde a la fase activa de registro y base transaccional, sin incluir reporteria avanzada.

### Key Entities *(include if feature involves data)*

- **Venta**: Transaccion comercial que registra empresa, tipo, referencia, descripcion, total, cliente opcional y metadatos de trazabilidad.
- **Pago**: Registro monetario asociado a una venta, con medio de pago y monto individual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de solicitudes validas de creacion de venta con uno o mas pagos se completan con respuesta exitosa y datos completos de venta + pagos.
- **SC-002**: El 100% de solicitudes con suma de pagos distinta al total son rechazadas con error 400 sin persistencia parcial.
- **SC-003**: El 100% de solicitudes con datos obligatorios incompletos o sin pagos son rechazadas con error 400.
- **SC-004**: El equipo puede ejecutar una prueba manual del flujo de creacion con `curl` en menos de 5 minutos usando ejemplos documentados.

## Assumptions

- La venta puede registrarse sin `cliente_id`.
- Los montos monetarios se comparan con precision definida para moneda local y sin tolerancias implicitas.
- Las validaciones de existencia de `cliente_id` se rigen por las reglas de integridad de datos ya establecidas en el sistema.
- Las pruebas manuales con `curl` se ejecutan en entorno local del backend.


# Feature Specification: UI Registro de Ventas

**Feature Branch**: `[005-ui-registro-ventas]`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Feature: UI Registro de Ventas

Stack:
- React + Vite
- Tailwind

Objetivo:
Crear formulario completo de registro de ventas.

Requerimientos:

1. Campos:
- Empresa (select)
- Tipo (select)
- Numero referencia
- Descripcion (textarea)
- Cliente (autocomplete)
- Telefono (auto)
- Valor total

2. Pagos dinamicos:
- Tabla editable
- Boton \"Agregar forma de pago\"
- Select + input monto
- Eliminar fila

3. Validaciones:
- Suma pagos vs total (visual)
- Indicador OK / error

4. UX:
- Flujo rapido
- Minimos clics"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar venta completa en una sola vista (Priority: P1)

Como operador de ventas, necesito registrar una venta completa con todos los datos obligatorios y los pagos asociados en una sola pantalla para cerrar la operacion sin pasos adicionales.

**Why this priority**: Es el flujo principal de negocio y el mayor impacto operativo diario.

**Independent Test**: Completar el formulario con datos validos de venta y pagos, guardar el registro y confirmar que la venta queda creada correctamente.

**Acceptance Scenarios**:

1. **Given** que el operador abre el registro de ventas, **When** completa empresa, tipo, referencia, descripcion, cliente y valor total, **Then** puede continuar con la captura de pagos sin salir de la vista.
2. **Given** que el operador selecciona un cliente desde el autocomplete, **When** el cliente queda seleccionado, **Then** el telefono se completa automaticamente con el dato asociado del cliente.
3. **Given** que todos los campos obligatorios estan diligenciados y la validacion de pagos es correcta, **When** el operador confirma el registro, **Then** la venta se guarda como operacion valida.

---

### User Story 2 - Gestionar multiples formas de pago dinamicamente (Priority: P1)

Como operador de ventas, necesito agregar, editar y eliminar filas de pago para reflejar ventas con una o varias formas de pago sin rehacer el formulario.

**Why this priority**: Muchas ventas requieren dividir montos; sin este flujo el registro queda incompleto o lento.

**Independent Test**: Crear una venta con al menos dos filas de pago, modificar montos y eliminar una fila, verificando que el formulario refleja los cambios en tiempo real.

**Acceptance Scenarios**:

1. **Given** que existe al menos una fila de pago, **When** el operador pulsa "Agregar forma de pago", **Then** se crea una nueva fila editable con selector de forma de pago y campo de monto.
2. **Given** que una fila de pago existe, **When** el operador actualiza forma de pago o monto, **Then** la tabla refleja el cambio inmediatamente.
3. **Given** que hay multiples filas, **When** el operador elimina una fila, **Then** la fila desaparece y el total de pagos se recalcula.

---

### User Story 3 - Validar consistencia entre total y pagos antes de guardar (Priority: P1)

Como operador de ventas, necesito ver de forma inmediata si la suma de pagos coincide con el valor total para evitar errores contables antes de confirmar la venta.

**Why this priority**: Previene registros inconsistentes y retrabajo administrativo.

**Independent Test**: Ingresar montos de pago que no coincidan con el total, verificar indicador de error, corregir montos y verificar cambio a estado OK.

**Acceptance Scenarios**:

1. **Given** que la suma de pagos es menor o mayor al valor total, **When** el operador revisa la validacion visual, **Then** ve un estado de error claro y accionable.
2. **Given** que la suma de pagos coincide exactamente con el valor total, **When** el operador revisa la validacion visual, **Then** ve un estado OK.
3. **Given** que la validacion de pagos esta en error, **When** el operador intenta confirmar el registro, **Then** el sistema bloquea la confirmacion e indica la discrepancia.

### Edge Cases

- El usuario intenta dejar el valor total vacio o en cero.
- El usuario agrega filas de pago sin seleccionar forma de pago.
- El usuario ingresa montos con formato invalido o negativos.
- El cliente seleccionado no tiene telefono registrado.
- El operador elimina todas las filas de pago despues de haber capturado montos.
- El valor total cambia despues de capturar pagos y deja la suma en estado inconsistente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar un formulario unico de registro de ventas con los campos: empresa, tipo, numero de referencia, descripcion, cliente, telefono y valor total.
- **FR-002**: El sistema MUST requerir empresa, tipo, cliente y valor total para permitir la confirmacion del registro.
- **FR-003**: El sistema MUST permitir seleccionar cliente mediante busqueda asistida (autocomplete) para acelerar el diligenciamiento.
- **FR-004**: El sistema MUST completar automaticamente el telefono al seleccionar un cliente, cuando exista ese dato.
- **FR-005**: El sistema MUST permitir registrar descripcion de la venta en un campo de texto multiliena.
- **FR-006**: El sistema MUST incluir una tabla editable de pagos con al menos una fila inicial.
- **FR-007**: El sistema MUST permitir agregar filas de pago mediante la accion "Agregar forma de pago".
- **FR-008**: Cada fila de pago MUST incluir una forma de pago seleccionable y un monto editable.
- **FR-009**: El sistema MUST permitir eliminar cualquier fila de pago.
- **FR-010**: El sistema MUST recalcular en tiempo real la suma de montos de pago ante cualquier cambio en filas.
- **FR-011**: El sistema MUST comparar visualmente la suma de pagos contra el valor total y mostrar indicador OK cuando coincidan exactamente.
- **FR-012**: El sistema MUST mostrar indicador de error cuando la suma de pagos no coincida con el valor total.
- **FR-013**: El sistema MUST impedir la confirmacion del registro mientras exista discrepancia entre suma de pagos y valor total.
- **FR-014**: El sistema MUST minimizar interacciones innecesarias, permitiendo completar el flujo principal sin navegar a otras vistas.
- **FR-015**: El sistema MUST conservar los datos ya digitados al agregar o eliminar filas de pago para evitar reprocesos.

### Constitutional Alignment *(mandatory)*

- **CA-001 Simplicity**: Se define una sola vista para registrar ventas y pagos, evitando pasos o pantallas adicionales fuera del alcance.
- **CA-002 Domain Model**: Se refuerzan entidades de negocio `Venta`, `Cliente` y `Pago`, incluyendo su relacion para pagos multiples.
- **CA-003 Backend Rules**: Las validaciones de coherencia de monto total contra pagos deben mantener una regla de negocio consistente y verificable.
- **CA-004 Persistence**: La informacion registrada debe mantenerse compatible con el modelo transaccional vigente sin alterar el alcance funcional de esta fase.
- **CA-005 Security**: La operacion de registrar ventas se mantiene dentro del contexto de usuarios autorizados del sistema administrativo.
- **CA-006 Modularity**: El alcance se concentra en el modulo de ventas y su experiencia de captura, sin extenderse a otros modulos.
- **CA-007 UX Productivity**: Se prioriza captura rapida con autocomplete, autocompletado de telefono y gestion dinamica de pagos.
- **CA-008 AI Decoupling**: La feature no introduce dependencias con flujos de analisis asistido o servicios de IA.
- **CA-009 Export Compatibility**: La consistencia de pagos y total mejora la calidad de datos para reportes y cierres posteriores.
- **CA-010 Deploy Local-First**: El flujo debe operar correctamente en entorno local/LAN como prioridad operativa.
- **CA-011 Traceability**: Cada venta debe conservar trazabilidad de sus pagos y del estado de validacion al momento del registro.
- **CA-012 Phase Control**: El alcance actual cubre UI de registro y validaciones funcionales; reportes avanzados y optimizaciones adicionales quedan fuera de esta fase.

### Key Entities *(include if feature involves data)*

- **Venta**: Registro comercial que agrupa datos de empresa, tipo, referencia, descripcion, cliente, valor total y estado de consistencia de pagos.
- **Cliente**: Persona o entidad asociada a la venta, con datos de identificacion y contacto (incluyendo telefono).
- **Pago**: Componente de una venta que representa una forma de pago y un monto; una venta puede tener uno o varios pagos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos 95% de operadores completan un registro de venta valido en menos de 2 minutos en pruebas operativas.
- **SC-002**: El 100% de ventas confirmadas cumple igualdad exacta entre valor total y suma de pagos.
- **SC-003**: Al menos 90% de ventas mixtas (2 o mas formas de pago) se registran sin correcciones posteriores por errores de distribucion de montos.
- **SC-004**: Al menos 90% de usuarios reporta que el flujo requiere pocos clics y no necesita salir de la vista para completar el registro.
- **SC-005**: La tasa de intentos bloqueados por inconsistencia de pagos disminuye al menos 40% despues de la primera semana de uso frente al flujo previo.

## Assumptions

- El catalogo de empresas, tipos de venta y formas de pago ya esta disponible para seleccion en el formulario.
- El sistema ya cuenta con datos de clientes consultables para autocomplete.
- Si un cliente no tiene telefono, el campo de telefono se mantiene vacio y editable segun reglas actuales del negocio.
- El registro de ventas en esta fase se enfoca en experiencia de captura y validacion, no en cambios de politicas contables.

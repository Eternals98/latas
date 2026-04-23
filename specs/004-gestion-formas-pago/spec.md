# Feature Specification: Gestion de Formas de Pago

**Feature Branch**: `[004-gestion-formas-pago]`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Feature: Gestion de Formas de Pago

Objetivo:
Centralizar los medios de pago disponibles.

Requerimientos:

1. Lista inicial:
- Efectivo
- Tarjeta Latas
- Tarjeta Tomas
- Bancolombia Latas
- Bancolombia Tomas
- BBVA Latas
- BBVA Tomas
- Nequi
- Davivienda
- Otro

2. Endpoint:
GET /api/medios-pago

3. Consideraciones:
- No hardcodear en frontend
- Preparado para futuro CRUD"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar medios de pago centralizados (Priority: P1)

Como operador, necesito consultar el catalogo centralizado de medios de pago para usar opciones consistentes en formularios de venta sin depender de listas embebidas en frontend.

**Why this priority**: Es el flujo base que evita inconsistencias operativas y habilita una fuente unica de verdad para pagos.

**Independent Test**: Consumir el listado de medios de pago y verificar que devuelve la lista inicial completa y consistente para poblar un selector.

**Acceptance Scenarios**:

1. **Given** que existe un catalogo inicial de medios de pago, **When** el frontend consulta el listado, **Then** recibe todas las opciones definidas en el alcance de la feature.
2. **Given** que no se han realizado cambios de administracion al catalogo, **When** se consulta multiples veces, **Then** los resultados son consistentes y ordenados de forma deterministica.

---

### User Story 2 - Mantener independencia del frontend (Priority: P1)

Como equipo de producto, necesitamos que el frontend obtenga los medios de pago desde backend para evitar hardcodeo y reducir mantenimiento duplicado.

**Why this priority**: Minimiza deuda tecnica y evita desalineacion entre reglas de negocio y la interfaz.

**Independent Test**: Integrar una pantalla consumiendo el listado desde backend y verificar que no requiere codificar manualmente las opciones en cliente.

**Acceptance Scenarios**:

1. **Given** que el frontend necesita mostrar medios de pago, **When** consulta el servicio de catalogo, **Then** obtiene datos suficientes para renderizar opciones sin reglas adicionales de negocio.
2. **Given** que la lista inicial incluye un elemento "Otro", **When** el frontend presenta opciones, **Then** puede ofrecer una alternativa generica sin hardcodear listas locales.

---

### User Story 3 - Preparar evolucion a CRUD (Priority: P2)

Como negocio, necesito que el catalogo de medios de pago quede preparado para evolucionar a operaciones de administracion futuras sin romper el consumo actual.

**Why this priority**: Reduce retrabajo en fases siguientes y asegura continuidad del contrato de consumo.

**Independent Test**: Verificar que el listado expone identificacion y metadatos minimos que permiten extender el modulo con crear/editar/activar/desactivar en el futuro.

**Acceptance Scenarios**:

1. **Given** que el catalogo de medios de pago es gestionado por backend, **When** se define la respuesta del listado, **Then** incluye atributos estables que facilitan futuras operaciones CRUD.
2. **Given** una futura necesidad de administracion del catalogo, **When** se planifique una siguiente fase, **Then** el flujo actual de consulta puede mantenerse sin cambios disruptivos.

### Edge Cases

- Si no existen medios de pago activos en catalogo, el sistema debe responder una lista vacia valida sin error.
- Si existen nombres de medios de pago con diferencias de mayusculas/minusculas, se debe conservar una representacion consistente para visualizacion.
- Si un medio de pago queda inactivo en el futuro, debe poder excluirse del listado operativo sin eliminar su trazabilidad historica.
- Consultas repetidas en una misma jornada deben devolver el mismo orden mientras no existan cambios administrativos en catalogo.
- El elemento "Otro" debe permanecer disponible para cubrir casos no previstos en el catalogo inicial.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST centralizar el catalogo de medios de pago en backend como fuente unica de verdad.
- **FR-002**: El sistema MUST exponer el endpoint `GET /api/medios-pago` para consultar el catalogo operativo.
- **FR-003**: El sistema MUST incluir inicialmente los siguientes medios de pago: `Efectivo`, `Tarjeta Latas`, `Tarjeta Tomas`, `Bancolombia Latas`, `Bancolombia Tomas`, `BBVA Latas`, `BBVA Tomas`, `Nequi`, `Davivienda`, `Otro`.
- **FR-004**: El sistema MUST devolver la lista de medios de pago con orden deterministico.
- **FR-005**: El sistema MUST entregar datos listos para consumo de frontend sin requerir hardcodeo de opciones en cliente.
- **FR-006**: El sistema MUST devolver una lista vacia valida cuando no existan medios de pago disponibles.
- **FR-007**: El sistema MUST definir identificacion estable por medio de pago para soportar futuras operaciones CRUD.
- **FR-008**: El sistema MUST conservar como atributos minimos de trazabilidad `creado_en`, `modificado_en` y `activo` para permitir evolucion de administracion del catalogo.
- **FR-009**: El sistema MUST permitir que el frontend refresque el catalogo consultando nuevamente el endpoint sin dependencias manuales.
- **FR-010**: El sistema MUST delimitar esta fase a consulta del catalogo; operaciones de crear, editar, activar/desactivar o eliminar quedan fuera de alcance actual.

### Constitutional Alignment *(mandatory)*

- **CA-001 Simplicity**: El alcance se limita a centralizar y consultar medios de pago, sin introducir capacidades administrativas adelantadas.
- **CA-002 Domain Model**: Se formaliza la entidad de catalogo `MedioPago` para uso en `Venta`.
- **CA-003 Backend Rules**: Las reglas de disponibilidad y consistencia del catalogo se definen en backend.
- **CA-004 Persistence**: El catalogo se modela con criterios compatibles con persistencia actual y futura migracion.
- **CA-005 Security**: No se agregan privilegios nuevos ni cambios de autenticacion en esta fase.
- **CA-006 Modularity**: El impacto se concentra en el modulo de pagos/catalogos y consumo desde ventas.
- **CA-007 UX Productivity**: El frontend obtiene opciones listas para uso, reduciendo friccion y errores por listas desactualizadas.
- **CA-008 AI Decoupling**: No existe dependencia con componentes de analisis IA ni `/api/analisis`.
- **CA-009 Export Compatibility**: Un catalogo consistente mejora coherencia de reportes financieros y consolidaciones futuras.
- **CA-010 Deploy Local-First**: La consulta del catalogo debe operar en entorno local/LAN sin dependencia cloud obligatoria.
- **CA-011 Traceability**: El catalogo de medios de pago mantiene base para trazabilidad de estado y cambios en fases siguientes.
- **CA-012 Phase Control**: Esta feature cubre solo lectura del catalogo y deja CRUD administrativo para una fase posterior explicita.

### Key Entities *(include if feature involves data)*

- **MedioPago**: Representa una opcion de pago disponible para registrar ventas, con nombre visible, identificador estable, estado operativo y trazabilidad basica.
- **Venta**: Transaccion que referencia un `MedioPago` valido del catalogo centralizado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de consultas al catalogo responde HTTP 200 con arreglo JSON y, por cada item, incluye `id`, `codigo`, `nombre`, `activo`, `creado_en` y `modificado_en`.
- **SC-002**: El 100% de los medios de pago de la lista inicial estan disponibles en la primera version operativa.
- **SC-003**: Al menos 95% de operadores pueden seleccionar un medio de pago correcto en menos de 5 segundos durante el flujo de venta.
- **SC-004**: El 100% de pantallas que usan medios de pago consumen el catalogo desde backend sin listas hardcodeadas locales.
- **SC-005**: La evolucion a una siguiente fase CRUD puede planificarse sin romper el contrato de consulta existente.

## Assumptions

- El catalogo inicial de medios de pago se administra por backend y se publica completo para consumo de interfaz.
- El frontend consumira `GET /api/medios-pago` como mecanismo oficial de carga de opciones.
- La fase actual no incluye pantallas ni endpoints de administracion de medios de pago.
- El estado operativo y trazabilidad de `MedioPago` se definiran con mayor detalle en la futura feature de CRUD.

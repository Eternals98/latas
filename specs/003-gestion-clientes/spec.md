# Feature Specification: Gestion de Clientes

**Feature Branch**: `[003-gestion-clientes]`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Feature: Gestion de Clientes

Objetivo:
Permitir busqueda, autocompletado y creacion de clientes.

Endpoints:

1. GET /api/clientes?search=texto
- Busqueda por coincidencia parcial en nombre
- Retorna lista limitada (top 10)

2. POST /api/clientes
- Crear cliente nuevo

3. Reglas:
- Evitar duplicados exactos
- Permitir coincidencias parciales

4. Uso esperado:
- Autocomplete en frontend"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Buscar clientes para autocompletar (Priority: P1)

Como operador, necesito buscar clientes por nombre parcial para seleccionar rapidamente el cliente correcto durante el registro de ventas.

**Why this priority**: Es el flujo principal que reduce tiempo de captura y errores de seleccion en la operacion diaria.

**Independent Test**: Ejecutar una busqueda por texto parcial y verificar que se devuelve una lista de hasta 10 coincidencias relevantes para seleccion.

**Acceptance Scenarios**:

1. **Given** que existen clientes registrados, **When** el operador busca con un texto parcial del nombre, **Then** el sistema devuelve una lista de clientes coincidentes limitada a 10 resultados.
2. **Given** que no hay coincidencias para el texto buscado, **When** el operador ejecuta la busqueda, **Then** el sistema devuelve una lista vacia sin error.

---

### User Story 2 - Crear cliente nuevo (Priority: P1)

Como operador, necesito crear un cliente nuevo cuando no existe en resultados de busqueda para continuar el flujo sin salir del contexto de trabajo.

**Why this priority**: Evita bloqueos operativos y asegura continuidad del proceso comercial en una sola sesion.

**Independent Test**: Registrar un cliente con datos validos y validar que queda disponible para futuras busquedas.

**Acceptance Scenarios**:

1. **Given** datos validos de un cliente que no existe, **When** se solicita crear el cliente, **Then** el sistema registra el cliente y confirma su creacion.
2. **Given** un cliente recien creado, **When** se realiza una busqueda parcial por su nombre, **Then** el cliente aparece dentro de los resultados.

---

### User Story 3 - Evitar duplicados exactos (Priority: P2)

Como negocio, necesito impedir la creacion de clientes duplicados exactos para mantener la calidad de datos y evitar inconsistencias operativas.

**Why this priority**: Protege la integridad de la base de clientes y reduce retrabajo administrativo.

**Independent Test**: Intentar crear dos veces un cliente con el mismo nombre exacto y verificar que la segunda solicitud es rechazada sin duplicar registros.

**Acceptance Scenarios**:

1. **Given** que ya existe un cliente con nombre exacto, **When** se intenta crear otro con el mismo nombre exacto, **Then** el sistema rechaza la creacion e informa conflicto por duplicado.
2. **Given** que existen clientes con nombres similares pero no exactos, **When** se crea un nuevo cliente con variacion parcial valida, **Then** el sistema permite la creacion.

### Edge Cases

- Busquedas con texto vacio o solo espacios deben devolver lista vacia sin error.
- Busquedas con mas de 10 coincidencias deben devolver solo las primeras 10 ordenadas por relevancia de coincidencia y, en empate, por nombre ascendente.
- Intentos de crear clientes con diferencias solo de espacios al inicio/fin deben tratarse como duplicado exacto.
- Intentos concurrentes de crear el mismo cliente deben terminar con un unico registro valido.
- Nombres muy cortos (1 caracter) deben ser permitidos en busqueda, manteniendo limite de resultados.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir buscar clientes por coincidencia parcial del nombre.
- **FR-002**: El sistema MUST devolver como maximo 10 resultados por cada busqueda de clientes.
- **FR-003**: El sistema MUST devolver una lista vacia cuando no existan coincidencias de busqueda.
- **FR-004**: El sistema MUST permitir crear un cliente nuevo exigiendo `nombre` como obligatorio y no vacio tras normalizacion; `telefono` es opcional.
- **FR-005**: El sistema MUST impedir la creacion de clientes con nombre duplicado exacto.
- **FR-006**: El sistema MUST permitir crear clientes con coincidencias parciales respecto a nombres existentes, siempre que no sean duplicado exacto.
- **FR-007**: El sistema MUST informar de forma clara cuando una creacion es rechazada por duplicado exacto.
- **FR-008**: El sistema MUST hacer disponible un cliente recien creado para busquedas posteriores.
- **FR-009**: El sistema MUST exponer respuestas de busqueda consistentes para que el frontend pueda implementar autocompletado sin logica de negocio adicional.
- **FR-010**: El sistema MUST normalizar entradas de busqueda removiendo espacios extra al inicio y fin antes de evaluar coincidencias.
- **FR-011**: El sistema MUST exponer los endpoints `GET /api/clientes?search=texto` y `POST /api/clientes` como contrato funcional del modulo Clientes.
- **FR-012**: El sistema MUST devolver resultados de busqueda con orden deterministico (relevancia y desempate por nombre ascendente).
- **FR-013**: El sistema MUST mantener trazabilidad minima en `Cliente` con `creado_en`, `modificado_en` y estado logico.

### Constitutional Alignment *(mandatory)*

- **CA-001 Simplicity**: El alcance se limita a busqueda/autocompletado y alta de clientes, sin introducir capacidades fuera del flujo solicitado.
- **CA-002 Domain Model**: Se fortalece la entidad `Cliente` y su uso operativo junto al flujo de `Venta`.
- **CA-003 Backend Rules**: La validacion de duplicado exacto se define como regla obligatoria de backend.
- **CA-004 Persistence**: La gestion de clientes mantiene compatibilidad con persistencia actual y futura migracion sin cambiar reglas de negocio.
- **CA-005 Security**: No se amplian privilegios administrativos ni se agregan mecanismos externos de autenticacion.
- **CA-006 Modularity**: El impacto se concentra en el modulo `Clientes` y su integracion con `Ventas`.
- **CA-007 UX Productivity**: El autocompletado y la creacion inmediata reducen friccion en captura operativa.
- **CA-008 AI Decoupling**: No se agrega dependencia del modulo de analisis IA ni de `/api/analisis`.
- **CA-009 Export Compatibility**: Mantener clientes sin duplicados exactos favorece calidad de informacion para reportes/exportaciones futuras.
- **CA-010 Deploy Local-First**: El flujo debe operar en entorno local/LAN sin dependencia cloud obligatoria.
- **CA-011 Traceability**: La entidad `Cliente` mantiene trazabilidad minima obligatoria con `creado_en`, `modificado_en` y estado logico.
- **CA-012 Phase Control**: Este feature se mantiene en la fase activa de consolidacion transaccional, sin incluir reportes o dashboard.

### Key Entities *(include if feature involves data)*

- **Cliente**: Representa una persona o empresa compradora, identificada por nombre, con trazabilidad temporal y estado logico para control operativo.
- **Venta**: Transaccion que puede referenciar a un `Cliente` previamente buscado o recien creado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En al menos 95% de las busquedas validas, el operador obtiene sugerencias de clientes en menos de 1 segundo en entorno local.
- **SC-002**: El 100% de intentos de creacion con nombre duplicado exacto son rechazados sin generar registros duplicados.
- **SC-003**: El 100% de busquedas devuelven un maximo de 10 resultados.
- **SC-004**: Al menos 90% de operadores logran encontrar o crear un cliente para continuar su flujo en menos de 15 segundos.
- **SC-005**: El 100% de clientes creados quedan registrados con trazabilidad minima completa (`creado_en`, `modificado_en`, estado logico).

## Assumptions

- El criterio de duplicado exacto se evalua sobre el nombre normalizado (ignorando espacios al inicio/fin).
- El feature se enfoca en nombre de cliente como criterio principal de busqueda para autocompletado.
- El frontend consumira la busqueda de clientes mientras el usuario escribe en formularios de venta.
- Operaciones avanzadas de edicion, fusion o eliminacion de clientes quedan fuera del alcance de este feature.

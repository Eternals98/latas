# Feature Specification: Reportes de Ventas

**Feature Branch**: `[006-reportes-ventas]`  
**Created**: 2026-04-23  
**Status**: Draft  
**Input**: User description: "Feature: Reportes de Ventas

Objetivo:
Consultar ventas por mes y exportarlas.

Endpoints:

1. GET /api/ventas?mes=&anio=
- Filtro por fecha
- Retorna lista

2. GET /api/ventas/export?tipo=formal|informal
- Genera Excel

Requerimientos:
- Agrupacion por mes
- Exportacion separada
- Formato simple tipo Excel actual (Luego se actualizara a uno mas elaborado)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consultar ventas de un mes (Priority: P1)

Como usuario operativo autorizado de reportes, necesito consultar las ventas de un mes y anio especificos para revisar la actividad comercial del periodo antes de generar reportes.

**Why this priority**: La consulta filtrada es la base de revision y validacion de los datos que luego se exportan.

**Independent Test**: Seleccionar un mes y anio con ventas registradas, ejecutar la consulta y verificar que la lista muestra solo ventas pertenecientes a ese periodo.

**Acceptance Scenarios**:

1. **Given** que existen ventas registradas en varios meses, **When** el usuario consulta un mes y anio especificos, **Then** recibe una lista limitada a las ventas de ese periodo.
2. **Given** que no existen ventas en el mes y anio consultados, **When** el usuario ejecuta la consulta, **Then** recibe una lista vacia sin error operativo.
3. **Given** que el usuario cambia el mes o el anio, **When** vuelve a consultar, **Then** los resultados reflejan el nuevo periodo seleccionado.

---

### User Story 2 - Revisar ventas agrupadas por mes (Priority: P1)

Como usuario operativo autorizado de reportes, necesito que las ventas consultadas puedan agruparse por mes para analizar totales del periodo y preparar cierres mensuales.

**Why this priority**: La agrupacion mensual responde directamente al objetivo de reportes y reduce revision manual.

**Independent Test**: Consultar un rango logico de ventas del mismo periodo y confirmar que el resultado permite identificar el mes, cantidad de ventas y total consolidado mensual.

**Acceptance Scenarios**:

1. **Given** que existen ventas para un mes consultado, **When** el usuario revisa el reporte, **Then** puede identificar el grupo mensual correspondiente y su total consolidado.
2. **Given** que la consulta se realiza para un mes y anio especificos, **When** se presentan los resultados, **Then** no se mezclan ventas de otros periodos.

---

### User Story 3 - Exportar ventas formales o informales (Priority: P2)

Como usuario operativo autorizado de reportes, necesito exportar las ventas en archivos separados por tipo formal o informal para entregar reportes acordes al uso contable u operativo requerido.

**Why this priority**: La exportacion separada es necesaria para usar la informacion fuera del sistema y mantener claridad entre salidas formales e informales.

**Independent Test**: Generar una exportacion formal y una informal, abrir ambos archivos y verificar que cada uno contiene ventas del tipo solicitado con formato tabular simple.

**Acceptance Scenarios**:

1. **Given** que existen ventas formales registradas, **When** el usuario solicita exportacion formal, **Then** se genera un archivo de hoja de calculo con solo ventas formales.
2. **Given** que existen ventas informales registradas, **When** el usuario solicita exportacion informal, **Then** se genera un archivo de hoja de calculo con solo ventas informales.
3. **Given** que no existen ventas para el tipo solicitado, **When** el usuario exporta, **Then** se genera una salida valida sin filas de ventas o se informa claramente que no hay datos para exportar.

### Edge Cases

- El usuario consulta sin mes, sin anio o con valores fuera de rango.
- El usuario consulta un mes valido para el que no existen ventas.
- Existen ventas en el limite del primer o ultimo dia del mes consultado.
- Existen ventas formales e informales en el mismo mes y deben mantenerse separadas al exportar.
- La exportacion se solicita para un tipo distinto de formal o informal.
- Los datos exportables contienen caracteres especiales o descripciones largas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir consultar ventas filtrando por mes y anio.
- **FR-002**: El sistema MUST validar que el mes y el anio de consulta sean valores presentes y validos antes de devolver resultados filtrados.
- **FR-003**: El sistema MUST retornar una lista de ventas activas que pertenezcan exclusivamente al mes y anio solicitados.
- **FR-004**: Cada venta listada MUST incluir la informacion necesaria para identificarla, revisar su fecha, cliente, tipo, valor total y pagos asociados cuando existan.
- **FR-005**: El sistema MUST manejar consultas sin resultados como una lista vacia, sin tratarlo como fallo del proceso.
- **FR-006**: El sistema MUST permitir agrupar ventas por mes para presentar o consumir totales consolidados del periodo consultado.
- **FR-007**: La agrupacion mensual MUST incluir al menos identificacion del mes, cantidad de ventas y valor total acumulado.
- **FR-008**: El sistema MUST permitir exportar ventas en una hoja de calculo para el tipo formal.
- **FR-009**: El sistema MUST permitir exportar ventas en una hoja de calculo para el tipo informal.
- **FR-010**: La exportacion formal MUST contener solo ventas activas clasificadas como formales.
- **FR-011**: La exportacion informal MUST contener solo ventas activas clasificadas como informales.
- **FR-012**: Las exportaciones MUST usar un formato tabular simple compatible con el formato de hoja de calculo actual del negocio.
- **FR-013**: Las exportaciones MUST incluir encabezados claros y filas de datos legibles para revision manual.
- **FR-014**: El sistema MUST rechazar solicitudes de exportacion con tipos distintos de formal o informal con un mensaje claro.
- **FR-015**: El formato elaborado de reportes queda fuera del alcance de esta fase y se abordara en una actualizacion posterior.

### Constitutional Alignment *(mandatory)*

- **CA-001 Simplicity**: El alcance se limita a consulta mensual, agrupacion basica y exportacion simple, sin diseno avanzado de reportes.
- **CA-002 Domain Model**: Se usan entidades existentes `Venta`, `Cliente` y `Pago`, manteniendo la venta como registro principal y pagos como detalle relacionado.
- **CA-003 Backend Rules**: Las reglas de filtro por fecha, separacion formal/informal y validacion de tipo de exportacion deben quedar centralizadas en el comportamiento de reportes.
- **CA-004 Persistence**: La consulta y exportacion deben operar sobre los datos persistidos existentes sin requerir cambios incompatibles con almacenamiento actual o futuro.
- **CA-005 Security**: La consulta y exportacion de ventas se mantienen dentro del flujo operativo local autorizado; no se clasifican como funciones administrativas de edicion o configuracion que requieran password/JWT en esta fase.
- **CA-006 Modularity**: El impacto se concentra en el modulo de Ventas/Reportes, sin modificar Gestion de Clientes, Formas de Pago o Analisis.
- **CA-007 UX Productivity**: La consulta por periodo y la exportacion separada deben requerir pocos pasos y producir resultados listos para revisar.
- **CA-008 AI Decoupling**: La feature no introduce dependencias con flujos de analisis asistido o servicios de IA.
- **CA-009 Export Compatibility**: La salida formal e informal debe generarse por separado y conservar compatibilidad con el formato simple de hoja de calculo actual.
- **CA-010 Deploy Local-First**: La consulta y exportacion deben funcionar en el entorno local/LAN sin depender de servicios cloud.
- **CA-011 Traceability**: Los reportes deben preservar fechas, identificadores y totales suficientes para rastrear cada venta exportada contra su registro original.
- **CA-012 Phase Control**: Esta fase cubre reportes mensuales y exportacion simple; formatos elaborados, graficas y analitica avanzada quedan fuera del alcance.

### Key Entities *(include if feature involves data)*

- **Venta**: Registro comercial consultado y exportado; incluye fecha, tipo formal/informal, cliente, descripcion, valor total y referencia.
- **Cliente**: Persona o entidad asociada a una venta, incluida para identificacion en la consulta y exportacion.
- **Pago**: Detalle monetario asociado a una venta, utilizado para trazabilidad del valor pagado cuando el reporte lo requiera.
- **Reporte Mensual**: Vista consolidada de ventas agrupadas por mes, con cantidad de ventas y total acumulado.
- **Exportacion de Ventas**: Archivo de hoja de calculo simple generado para ventas formales o informales por separado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de consultas con mes y anio validos devuelve solo ventas pertenecientes al periodo solicitado.
- **SC-002**: Los usuarios operativos autorizados pueden obtener una lista mensual de ventas en menos de 10 segundos para periodos operativos normales.
- **SC-003**: El 100% de exportaciones formales e informales contiene unicamente ventas del tipo solicitado.
- **SC-004**: Al menos 95% de archivos exportados puede abrirse correctamente en una aplicacion de hoja de calculo sin ajustes manuales.
- **SC-005**: Al menos 90% de usuarios operativos autorizados puede consultar un mes y generar la exportacion requerida en menos de 1 minuto.

## Assumptions

- Las ventas ya registran una fecha usable para filtros mensuales.
- Las ventas ya distinguen entre tipo formal e informal.
- La exportacion usa el periodo o conjunto de ventas definido por el flujo de reporte vigente; si no se especifica periodo al exportar, se aplica el comportamiento actual del sistema.
- El formato simple actual de Excel es suficiente para esta fase y no incluye estilos avanzados, graficas ni formulas complejas.
- Los usuarios de esta feature son operadores autorizados dentro del sistema local; la administracion protegida por password/JWT queda reservada para edicion, configuracion y funciones admin posteriores.

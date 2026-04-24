# Feature Specification: Dashboard de Negocio

**Feature Branch**: `008-dashboard-negocio`  
**Created**: 2026-04-24  
**Status**: Draft  
**Input**: User description: "Feature: Dashboard

Objetivo:
Visualizar indicadores de negocio.

Endpoints:

GET /api/dashboard

Datos:
- Ventas por mes
- Ventas por empresa
- Metodos de pago
- Ticket promedio

Frontend:
- Recharts"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar indicadores principales (Priority: P1)

Como usuario operativo autorizado, necesito ver en un solo dashboard los indicadores principales de ventas para entender rapidamente el desempeno del negocio.

**Why this priority**: La vista consolidada entrega el valor central de la feature y reduce la revision manual de reportes separados.

**Independent Test**: Puede probarse abriendo el dashboard con ventas existentes y verificando que muestra ventas por mes, ticket promedio y totales generales de forma legible.

**Acceptance Scenarios**:

1. **Given** que existen ventas activas registradas, **When** el usuario abre el dashboard, **Then** visualiza indicadores consolidados de negocio basados en esas ventas.
2. **Given** que existen ventas en varios meses, **When** el usuario revisa el dashboard, **Then** puede comparar visualmente el comportamiento mensual de ventas.
3. **Given** que existen ventas con distintos importes, **When** el usuario revisa el dashboard, **Then** ve el ticket promedio calculado para el conjunto de ventas mostrado.

---

### User Story 2 - Analizar ventas por empresa (Priority: P2)

Como usuario operativo autorizado, necesito ver las ventas agrupadas por empresa para identificar que clientes o empresas concentran mayor volumen de negocio.

**Why this priority**: El desglose por empresa permite detectar concentracion, oportunidades comerciales y dependencias relevantes.

**Independent Test**: Puede probarse cargando ventas asociadas a varias empresas y verificando que el dashboard muestra el total correspondiente a cada empresa sin mezclar registros.

**Acceptance Scenarios**:

1. **Given** que existen ventas asociadas a diferentes empresas, **When** el usuario consulta el dashboard, **Then** ve un desglose de ventas por empresa.
2. **Given** que una empresa no tiene ventas activas en el conjunto mostrado, **When** se presenta el desglose, **Then** esa empresa no aparece como generadora de ventas activas o aparece con valor cero solo si el diseno de visualizacion lo requiere.
3. **Given** que existen ventas anuladas para una empresa, **When** el usuario revisa el dashboard, **Then** esas ventas no incrementan los indicadores activos.

---

### User Story 3 - Comparar metodos de pago (Priority: P3)

Como usuario operativo autorizado, necesito ver como se distribuyen las ventas por metodo de pago para entender patrones de cobro y conciliacion.

**Why this priority**: La distribucion por metodo de pago ayuda a revisar flujo operativo y consistencia de los cobros.

**Independent Test**: Puede probarse registrando ventas con diferentes metodos de pago y confirmando que el dashboard agrupa importes y cantidades por metodo.

**Acceptance Scenarios**:

1. **Given** que existen pagos registrados con distintos metodos, **When** el usuario abre el dashboard, **Then** ve la distribucion de ventas o importes por metodo de pago.
2. **Given** que una venta tiene mas de un pago, **When** se calcula la distribucion, **Then** cada pago contribuye al metodo que corresponde sin duplicar el total de la venta.
3. **Given** que no existen pagos para un metodo especifico, **When** se presenta la distribucion, **Then** el metodo no distorsiona los totales mostrados.

### Edge Cases

- No existen ventas activas registradas todavia.
- Existen ventas anuladas que no deben contar en indicadores activos.
- Existen ventas sin cliente asociado o con datos de cliente incompletos, pero siempre con empresa comercial definida.
- Existen ventas con multiples pagos o metodos de pago mixtos.
- Existen importes en cero, negativos no permitidos o datos historicos inconsistentes.
- El conjunto de datos contiene meses sin ventas entre meses con actividad.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST proporcionar una vista de dashboard con indicadores de negocio basados en ventas activas.
- **FR-002**: El dashboard MUST mostrar ventas agrupadas por mes, incluyendo al menos identificacion del mes y valor total de ventas.
- **FR-003**: El dashboard MUST mostrar ventas agrupadas por empresa, incluyendo al menos identificacion de la empresa y valor total asociado.
- **FR-004**: El dashboard MUST mostrar una distribucion por metodos de pago que permita comparar el peso de cada metodo.
- **FR-005**: El dashboard MUST mostrar el ticket promedio para el conjunto de ventas considerado.
- **FR-006**: El calculo del ticket promedio MUST dividir el valor total de ventas activas entre la cantidad de ventas activas incluidas.
- **FR-007**: Los indicadores MUST excluir ventas anuladas de los calculos activos.
- **FR-008**: El dashboard MUST manejar la ausencia de ventas activas mostrando valores vacios o cero de forma clara, sin tratarlo como error operativo.
- **FR-009**: El sistema MUST mantener consistencia entre totales generales y desgloses por mes, empresa y metodo de pago.
- **FR-010**: El dashboard MUST presentar los indicadores de forma visual y legible para comparacion rapida.
- **FR-011**: El sistema MUST permitir que el dashboard se actualice cuando cambien los datos de ventas, sin requerir recalculos manuales por parte del usuario.
- **FR-012**: Los indicadores MUST usar reglas de negocio centralizadas para totales, estados de ventas y pagos, evitando diferencias con reportes activos existentes.
- **FR-013**: El dashboard MUST destacar el total de ventas activas del mes actual junto al ticket promedio.

### Constitutional Alignment *(mandatory)*

- **CA-001 Simplicity**: El alcance se limita a indicadores de negocio esenciales: ventas por mes, ventas por empresa, metodos de pago y ticket promedio. Predicciones, metas, alertas y analitica avanzada quedan fuera de esta fase.
- **CA-002 Domain Model**: Las entidades afectadas son `Venta` como origen de los importes y fechas, `Cliente` o empresa como agrupador comercial, y `Pago` como fuente de metodos de pago.
- **CA-003 Backend Rules**: Los calculos de totales, exclusion de ventas anuladas, agrupacion mensual, agrupacion por empresa y distribucion por pagos deben quedar definidos como reglas del backend.
- **CA-004 Persistence**: La feature consume datos persistidos existentes y debe mantenerse compatible con el modelo relacional actual y su evolucion PostgreSQL-compatible.
- **CA-005 Security**: El dashboard queda disponible para usuarios operativos autorizados del entorno local; no introduce operaciones administrativas de edicion ni cambios de datos.
- **CA-006 Modularity**: El impacto se concentra en el modulo `Reportes` como subfuncion de dashboard y reutiliza Ventas, Clientes y Pagos como fuentes de datos, sin modificar Administracion ni Analisis.
- **CA-007 UX Productivity**: El usuario debe obtener una lectura rapida del estado del negocio sin exportar archivos ni consolidar datos manualmente.
- **CA-008 AI Decoupling**: La feature no depende de analisis asistido ni modifica el flujo de `/api/analisis`.
- **CA-009 Export Compatibility**: No se agregan nuevas exportaciones; reportes y exportaciones existentes deben conservar su comportamiento mientras el dashboard usa las mismas reglas de ventas activas.
- **CA-010 Deploy Local-First**: El dashboard debe funcionar en el entorno local/LAN y offline-capable del sistema, sin depender de servicios cloud.
- **CA-011 Traceability**: Los indicadores deben poder rastrearse a ventas, clientes y pagos existentes mediante periodos, empresas y metodos de pago reconocibles.
- **CA-012 Phase Control**: Esta fase cubre visualizacion de indicadores de negocio. Filtros avanzados, comparativos por rango flexible, objetivos comerciales, auditoria detallada y predicciones quedan fuera del alcance.

### Key Entities *(include if feature involves data)*

- **Venta**: Registro comercial activo usado para calcular totales mensuales, ventas por empresa y ticket promedio; las ventas anuladas quedan excluidas de indicadores activos.
- **Cliente/Empresa**: Entidad comercial asociada a una venta y usada para agrupar el volumen de negocio por empresa.
- **Pago**: Registro de cobro asociado a una venta; aporta el metodo de pago para calcular la distribucion por forma de cobro.
- **Indicador de Dashboard**: Resultado agregado que representa una metrica de negocio, como total mensual, total por empresa, distribucion de pagos o ticket promedio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los indicadores mostrados excluye ventas anuladas de los calculos activos.
- **SC-002**: Usuarios operativos autorizados pueden identificar el total de ventas del mes actual y el ticket promedio en menos de 30 segundos desde que abren el dashboard.
- **SC-003**: El 100% de los desgloses por mes, empresa y metodo de pago cuadra con los totales activos usados por reportes existentes para el mismo conjunto de datos.
- **SC-004**: El dashboard muestra un estado comprensible sin errores operativos cuando no existen ventas activas.
- **SC-005**: Al menos 90% de usuarios operativos autorizados puede responder cual empresa concentra mas ventas y cual metodo de pago predomina en menos de 1 minuto.

## Assumptions

- Los usuarios del dashboard son operadores autorizados dentro del entorno local existente.
- Las ventas activas ya tienen fecha, importe total y estado suficientes para agregacion.
- La empresa se obtiene desde el campo comercial obligatorio de la venta; el cliente puede faltar sin impedir la agrupacion por empresa.
- Los metodos de pago se obtienen desde los pagos registrados y pueden existir ventas con multiples pagos.
- La primera version del dashboard usa el conjunto completo de ventas activas disponible, sin filtros avanzados por rango o usuario.
- Las visualizaciones deben ser legibles en navegadores de escritorio usados en la operacion diaria.

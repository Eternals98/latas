# Research: Dashboard de Negocio

## Decision: Backend calcula todos los indicadores de dashboard

**Rationale**: La constitucion exige backend como unica fuente de verdad para reglas criticas. Centralizar
totales, ticket promedio, exclusion de anuladas y agrupaciones evita que frontend y reportes calculen
valores distintos.

**Alternatives considered**:
- Calcular en frontend a partir de una lista de ventas: rechazado porque duplica reglas y puede degradar con mas datos.
- Crear tablas de resumen persistidas: rechazado por sobreingenieria para el volumen operativo actual.

## Decision: `GET /api/dashboard` devuelve un payload agregado unico

**Rationale**: La feature necesita cuatro indicadores al abrir una sola pantalla. Un endpoint unico reduce
roundtrips, simplifica contract tests y mantiene una respuesta consistente para la UI.

**Alternatives considered**:
- Un endpoint por grafica: rechazado porque aumenta superficie API sin necesidad en v1.
- Reutilizar `GET /api/ventas?mes=&anio=`: rechazado porque esa API es mensual y no cubre empresa, metodos de pago ni ticket promedio global.

## Decision: No agregar filtros avanzados en v1

**Rationale**: La especificacion asume el conjunto completo de ventas activas y difiere rangos flexibles.
Esto mantiene la fase 4 acotada y permite entregar valor con indicadores basicos.

**Alternatives considered**:
- Filtros por rango, empresa y tipo desde el inicio: rechazado por ampliar alcance y pruebas.
- Dashboard solo del mes actual: rechazado porque la spec pide ventas por mes y comparacion temporal.

## Decision: Agrupacion mensual por fecha de creacion de venta

**Rationale**: El modelo actual usa `creado_en` como fecha disponible para reportes mensuales. Mantener
la misma fuente alinea dashboard y reportes existentes.

**Alternatives considered**:
- Agregar una fecha comercial nueva: rechazado porque requiere cambio de modelo fuera del alcance.
- Usar fecha de pagos: rechazado porque una venta puede tener multiples pagos y distorsionaria ventas por mes.

## Decision: Distribucion por metodo de pago basada en `Pago.medio` y `Pago.monto`

**Rationale**: Una venta puede tener multiples pagos. Agrupar por pagos permite que cada metodo reciba
solo el monto que le corresponde y evita duplicar el total de la venta.

**Alternatives considered**:
- Contar una venta completa por cada metodo usado: rechazado porque duplica montos en ventas mixtas.
- Usar catalogo `MedioPago` como fuente primaria: rechazado para v1 porque los pagos guardan el medio efectivo utilizado.

## Decision: Recharts para visualizacion frontend

**Rationale**: El usuario lo pidio explicitamente y encaja con React/Vite. La libreria cubre barras, lineas
y graficas circulares sin construir visualizaciones manuales.

**Alternatives considered**:
- Graficas CSS o SVG manuales: rechazado por costo de mantenimiento.
- Otra libreria de charts: rechazado porque no aporta ventaja clara frente al requerimiento explicito.

# Research: Reportes de Ventas

## Decision: Filtrar ventas mensuales por rango de fechas

**Rationale**: Calcular `fecha_inicio` y `fecha_fin` del mes en la capa de servicio y consultar
`Venta.creado_en >= fecha_inicio` y `< fecha_fin` evita depender de funciones SQL especificas
de SQLite. Esto mantiene compatibilidad con PostgreSQL y permite incluir correctamente ventas
del primer y ultimo dia del mes.

**Alternatives considered**:
- Extraer mes/anio con funciones SQL: mas corto, pero menos portable entre SQLite y PostgreSQL.
- Guardar campos derivados `mes` y `anio`: innecesario para el alcance y agrega riesgo de datos duplicados.

## Decision: Reutilizar `GET /api/ventas` para listado filtrado

**Rationale**: El endpoint de ventas ya representa el recurso principal. Agregar lectura con
`mes` y `anio` mantiene una API simple y evita introducir un recurso paralelo para una lista
que sigue siendo de ventas.

**Alternatives considered**:
- Crear `/api/reportes/ventas`: separa semantica de reportes, pero duplica responsabilidad para esta fase.
- Usar POST de busqueda: innecesario porque los filtros son simples y caben en query params.

## Decision: Responder lista con resumen mensual incluido

**Rationale**: La especificacion exige lista y agrupacion por mes. Como la consulta filtra un
solo mes/anio, una respuesta con `items` y `resumen_mensual` cubre ambos sin obligar a una
segunda llamada.

**Alternatives considered**:
- Retornar solo array: cumple lista, pero deja la agrupacion fuera del contrato.
- Crear endpoint exclusivo de totales: util en dashboard futuro, fuera del alcance actual.

## Decision: Exportar XLSX con `openpyxl`

**Rationale**: El negocio requiere compatibilidad con Excel y formato simple. `openpyxl` permite
crear archivos `.xlsx` sin depender de Excel instalado, es comun en Python y suficiente para
encabezados y filas tabulares.

**Alternatives considered**:
- CSV: mas simple, pero no cumple estrictamente la expectativa de archivo Excel actual.
- xlsxwriter: viable, pero `openpyxl` es suficiente y tambien facilita futuras lecturas si se necesitan pruebas.

## Decision: Exportacion separada por `tipo` con filtro mensual opcional

**Rationale**: El contrato requerido define `tipo=formal|informal` como separador obligatorio.
Agregar `mes` y `anio` opcionales permite exportar el periodo consultado sin romper el endpoint
base solicitado; si ambos faltan, se exportan las ventas activas del tipo indicado segun el
comportamiento operativo vigente.

**Alternatives considered**:
- Exigir siempre mes/anio en exportacion: mas consistente con reportes mensuales, pero cambia el endpoint minimo pedido.
- Exportar ambos tipos en un solo archivo con hojas separadas: contradice exportacion separada.

## Decision: Mantener formato de Excel sin estilos avanzados

**Rationale**: El alcance pide formato simple tipo Excel actual y difiere un formato elaborado.
La primera version debe priorizar encabezados claros, filas legibles, montos y fechas trazables.

**Alternatives considered**:
- Plantilla de Excel elaborada: fuera de alcance y aumenta costo de mantenimiento.
- Formulas o graficas: pertenecen a dashboard/reportes avanzados posteriores.

## Verification Notes

- Final backend pytest result: `python -m pytest` -> 55 passed on Python 3.14.3.
- Final frontend build result: `npm run build` -> passed after `npm install`.

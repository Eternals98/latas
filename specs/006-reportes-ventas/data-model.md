# Data Model: Reportes de Ventas

## Entity: Venta (persisted)

**Description**: Registro comercial principal consultado y exportado.

### Fields used by this feature

- `id` (integer): identificador trazable de la venta.
- `empresa` (string): empresa asociada.
- `tipo` (string): `formal` o `informal`.
- `numero_referencia` (string): factura, nota o referencia operativa.
- `descripcion` (string): detalle de la venta.
- `valor_total` (decimal 12,2): total monetario de la venta.
- `cliente_id` (integer, nullable): cliente asociado.
- `estado` (string): estado logico, normalmente `activo`.
- `creado_en` (datetime): fecha usada para filtro mensual.
- `modificado_en` (datetime): trazabilidad de cambios.

### Validation rules

- `mes` MUST estar entre 1 y 12 cuando se consulta por periodo.
- `anio` MUST ser un anio positivo razonable cuando se consulta por periodo.
- El filtro mensual MUST incluir ventas desde el primer instante del mes hasta antes del primer instante del mes siguiente.
- Las ventas anuladas no deben mezclarse con reportes operativos activos salvo que una fase futura lo especifique; consulta mensual y exportacion filtran `estado = activo`.

## Entity: Cliente (persisted)

**Description**: Cliente asociado a una venta para identificacion en listados y exportaciones.

### Fields used by this feature

- `id` (integer)
- `nombre` (string)
- `telefono` (string, nullable)
- `estado` (string)

### Relationships

- `Venta N:1 Cliente`; una venta puede tener cliente nulo segun reglas existentes.

## Entity: Pago (persisted)

**Description**: Linea de pago asociada a una venta, incluida para trazabilidad cuando se devuelva o exporte detalle.

### Fields used by this feature

- `id` (integer)
- `venta_id` (integer)
- `medio` (string)
- `monto` (decimal 12,2)

### Relationships

- `Venta 1:N Pago`.

## Entity: VentaReporteItem (response DTO)

**Description**: Representacion legible de una venta en el listado mensual.

### Fields

- `id` (integer)
- `fecha` (datetime)
- `empresa` (string)
- `tipo` (`formal | informal`)
- `numero_referencia` (string)
- `descripcion` (string)
- `cliente` (object nullable: `id`, `nombre`, `telefono`)
- `valor_total` (decimal string)
- `estado` (string)
- `pagos` (array of `PagoReporteItem`)

## Entity: PagoReporteItem (response DTO)

**Description**: Pago serializado dentro de una venta reportada.

### Fields

- `id` (integer)
- `medio` (string)
- `monto` (decimal string)

## Entity: ResumenMensualVentas (response DTO)

**Description**: Totales consolidados para el mes consultado.

### Fields

- `mes` (integer)
- `anio` (integer)
- `cantidad_ventas` (integer)
- `valor_total` (decimal string)

## Entity: VentasMensualesResponse (response DTO)

**Description**: Respuesta completa de consulta mensual.

### Fields

- `mes` (integer)
- `anio` (integer)
- `items` (array of `VentaReporteItem`)
- `resumen_mensual` (`ResumenMensualVentas`)

## Entity: ExportacionVentasRequest (query contract)

**Description**: Parametros para generar archivo de hoja de calculo.

### Fields

- `tipo` (`formal | informal`, required)
- `mes` (integer 1..12, optional)
- `anio` (integer, optional)

### Validation rules

- `tipo` MUST be `formal` or `informal`.
- If one of `mes` or `anio` is provided, both MUST be provided.
- When `mes` and `anio` are provided, export MUST include only sales from that month and year.
- Export MUST include only sales matching `tipo`.

## Export Columns

Simple XLSX columns for this phase:

- `Fecha`
- `Empresa`
- `Tipo`
- `Numero referencia`
- `Cliente`
- `Telefono`
- `Descripcion`
- `Valor total`
- `Medios de pago`
- `Estado`

Advanced formatting, formulas, charts, pivot tables, and multi-sheet summaries are out of scope.

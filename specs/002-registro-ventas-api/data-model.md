# Data Model: Registro de Ventas API

## Entity: Venta

- **Description**: Transaccion principal de venta.
- **Source Table**: `venta`

### Fields

- `id` (integer, PK, autoincrement)
- `empresa` (string, required)
- `tipo` (string, required)
- `numero_referencia` (string, required)
- `descripcion` (string, required)
- `valor_total` (decimal(12,2), required, `>= 0`)
- `cliente_id` (integer, nullable, FK -> `cliente.id`)
- `estado` (string, required, default `activo`)
- `creado_en` (datetime, required)
- `modificado_en` (datetime, required)

### Validation Rules

- `empresa` MUST be present and non-empty.
- `tipo` MUST be present and non-empty.
- `valor_total` MUST be >= 0.

## Entity: Pago

- **Description**: Registro de pago asociado a una venta.
- **Source Table**: `pago`

### Fields

- `id` (integer, PK, autoincrement)
- `venta_id` (integer, required, FK -> `venta.id`)
- `medio` (string, required)
- `monto` (decimal(12,2), required, `> 0`)

### Validation Rules

- Debe existir al menos un pago por solicitud de creacion de venta.
- `monto` MUST be > 0.

## Relationships

- `Venta 1:N Pago`
- `Cliente 1:N Venta` (opcional desde Venta)

## Aggregate-Level Business Rules

- `sum(pagos[].monto)` MUST equal `venta.valor_total`.
- Si falla la creacion de cualquier `Pago`, la `Venta` no debe persistirse.

## Request/Response Contracts (Logical)

### Request: CreateVenta

- `empresa` (string, required)
- `tipo` (string, required)
- `numero_referencia` (string, required)
- `descripcion` (string, required)
- `valor_total` (string decimal, required)
- `cliente_id` (integer, optional)
- `pagos` (array, required, minItems: 1)
  - item:
    - `medio` (string, required)
    - `monto` (string decimal, required)

### Response: VentaCreated

- `id`
- `empresa`
- `tipo`
- `numero_referencia`
- `descripcion`
- `valor_total`
- `cliente_id`
- `estado`
- `creado_en`
- `modificado_en`
- `pagos` (array de pagos creados)

## State Transitions

- `Venta` se crea en estado `activo`.
- Este feature no contempla transiciones a `anulado` ni edicion posterior.

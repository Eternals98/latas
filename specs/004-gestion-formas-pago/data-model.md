# Data Model: Gestion de Formas de Pago

## Entity: MedioPago

- **Description**: Catalogo oficial de medios de pago habilitados para el registro de ventas.
- **Source Table**: `medio_pago`

### Fields

- `id` (integer, PK, autoincrement)
- `codigo` (string(50), required, unique, estable)
- `nombre` (string(120), required, unique en operacion)
- `activo` (boolean, required, default `true`)
- `creado_en` (datetime, required)
- `modificado_en` (datetime, required)

### Validation Rules

- `codigo` MUST ser unico y no vacio tras normalizacion simple.
- `nombre` MUST ser no vacio y unico para evitar duplicidad de opciones en UI.
- `activo` MUST controlar visibilidad operativa en `GET /api/medios-pago`.
- `creado_en` y `modificado_en` MUST existir para trazabilidad minima.

## Entity: Pago (affected relation)

- **Description**: Registro de pago asociado a una venta, que utiliza un medio de pago del catalogo.
- **Source Table**: `pago`

### Fields (relevant for this feature)

- `id` (integer, PK)
- `venta_id` (integer, FK -> `venta.id`)
- `medio` (string, compatibilidad actual de captura)
- `monto` (numeric, required)

## Relationships

- `MedioPago` es catalogo referencial para captura de `Pago` en `Venta`.
- `Venta 1:N Pago` se mantiene sin cambios en esta fase.

## Aggregate-Level Business Rules

- `GET /api/medios-pago` MUST devolver solo medios con `activo = true`.
- El catalogo MUST incluir inicialmente: `Efectivo`, `Tarjeta Latas`, `Tarjeta Tomas`, `Bancolombia Latas`, `Bancolombia Tomas`, `BBVA Latas`, `BBVA Tomas`, `Nequi`, `Davivienda`, `Otro`.
- El resultado MUST mantener orden deterministico por nombre.
- Si no hay registros activos, el endpoint MUST devolver `[]` sin error.
- En esta fase NO se exponen operaciones de crear/editar/activar/desactivar/eliminar medios.

## Request/Response Contracts (Logical)

### Request: ListMediosPago

- Sin body ni parametros obligatorios.

### Response: ListMediosPagoResult

- Lista de medios de pago activos:
  - `id`
  - `codigo`
  - `nombre`
  - `activo`
  - `creado_en`
  - `modificado_en`

## State Transitions

- `MedioPago` inicia en estado activo al ser creado en catalogo.
- En esta fase no hay transiciones expuestas al usuario final (solo consulta).
- Activacion/inactivacion quedara para la feature CRUD posterior.

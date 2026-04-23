# Data Model: UI Registro de Ventas

## Entity: Venta (backend persisted)

- **Description**: Transaccion principal de registro comercial.
- **Source Table**: `venta`

### Fields

- `id` (integer, PK)
- `empresa` (string, required, enum domain)
- `tipo` (string, required, enum domain)
- `numero_referencia` (string, required)
- `descripcion` (string, required)
- `valor_total` (decimal 12,2, required, >= 0)
- `cliente_id` (integer, nullable)
- `estado` (string)
- `creado_en` (datetime)
- `modificado_en` (datetime)

## Entity: Pago (backend persisted)

- **Description**: Linea de pago asociada a una venta.
- **Source Table**: `pago`

### Fields

- `id` (integer, PK)
- `venta_id` (integer, FK -> `venta.id`)
- `medio` (string, required)
- `monto` (decimal 12,2, required, > 0)

## Entity: Cliente (backend persisted, consumed by autocomplete)

- **Description**: Cliente seleccionable durante el registro de venta.
- **Source Table**: `cliente`

### Fields (relevant for this feature)

- `id` (integer, PK)
- `nombre` (string, required)
- `telefono` (string, nullable)
- `estado` (string)

## Entity: RegistroVentaFormState (frontend transient)

- **Description**: Estado de la vista para captura rapida de venta y pagos.
- **Lifecycle**: Solo en cliente; no persistido.

### Fields

- `empresa` (string)
- `tipo` (string)
- `numeroReferencia` (string)
- `descripcion` (string)
- `cliente` (`{ id, nombre, telefono } | null`)
- `telefono` (string)
- `valorTotal` (string de entrada monetaria)
- `pagos` (array de `PagoDraft`)
- `paymentTotal` (decimal calculado)
- `isBalanced` (boolean)
- `validationState` (`ok | error | neutral`)
- `errors` (mapa campo -> mensaje)

## Entity: PagoDraft (frontend transient)

- **Description**: Fila editable en tabla de pagos.

### Fields

- `rowId` (string unico en UI)
- `medio` (string)
- `monto` (string de entrada monetaria)

## Relationships

- `Venta 1:N Pago` (persistente en backend).
- `Venta N:1 Cliente` (cliente opcional por venta).
- `RegistroVentaFormState 1:N PagoDraft` (estado local para interaccion UI).

## Validation Rules

- `empresa`, `tipo`, `cliente`, `valorTotal` MUST ser obligatorios para habilitar envio.
- `pagos` MUST contener al menos una fila con `medio` y `monto > 0`.
- `sum(pagos.monto)` MUST ser exactamente igual a `valorTotal` para estado `isBalanced = true`.
- Cambios en `valorTotal` o cualquier `PagoDraft` MUST recalcular `paymentTotal` y `validationState` en tiempo real.
- Si `cliente.telefono` existe, `telefono` MUST autocompletarse al seleccionar cliente.

## State Transitions (UI)

- `idle -> editing`: usuario inicia captura de campos.
- `editing -> mismatch`: pagos y total no cuadran.
- `editing -> balanced`: pagos y total cuadran.
- `balanced -> submitting`: usuario confirma envio.
- `submitting -> success`: backend responde `201`.
- `submitting -> error`: backend responde validacion/errores y UI conserva datos para correccion.

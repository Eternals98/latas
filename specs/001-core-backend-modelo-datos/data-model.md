# Data Model: Core Backend y Modelo de Datos

## Entity: Cliente

- **Description**: Persona o entidad compradora opcional asociada a ventas.
- **Fields**:
  - `id`: integer, PK, autoincrement, required
  - `nombre`: string(160), required, not null
  - `telefono`: string(40), optional, nullable
  - `creado_en`: datetime, required, default current timestamp
- **Constraints**:
  - `nombre` no puede ser vacío tras trim.
- **Relationships**:
  - `Cliente` 1:N `Venta` (una venta puede no tener cliente).

## Entity: Venta

- **Description**: Registro principal de transacción comercial.
- **Fields**:
  - `id`: integer, PK, autoincrement, required
  - `empresa`: enum(`latas_sas`, `tomas_gomez`), required
  - `tipo`: enum(`formal`, `informal`), required
  - `numero_referencia`: string(100), required
  - `descripcion`: text, required
  - `valor_total`: decimal(12,2), required, must be >= 0
  - `cliente_id`: integer, FK -> `cliente.id`, optional, nullable
  - `estado`: enum(`activo`, `anulado`), required, default `activo`
  - `creado_en`: datetime, required, default current timestamp
  - `modificado_en`: datetime, required, auto-update on modification
- **Constraints**:
  - `valor_total >= 0`
  - `estado` restringido al conjunto permitido.
- **Relationships**:
  - `Venta` N:1 `Cliente` (opcional)
  - `Venta` 1:N `Pago` (obligatoria para pagos, no para existencia de venta)

## Entity: Pago

- **Description**: Movimiento de pago parcial o total aplicado a una venta.
- **Fields**:
  - `id`: integer, PK, autoincrement, required
  - `venta_id`: integer, FK -> `venta.id`, required, not null
  - `medio`: string(60) o enum configurable, required
  - `monto`: decimal(12,2), required, must be > 0
- **Constraints**:
  - `monto > 0`
  - Integridad referencial obligatoria contra `venta_id`.
- **Relationships**:
  - `Pago` N:1 `Venta`.

## Relationship Summary

- `Cliente (1) -> (N) Venta` con `cliente_id` nullable.
- `Venta (1) -> (N) Pago` con `venta_id` obligatorio.

## State Transitions

### Venta.estado

- `activo` -> `anulado` (permitido)
- `anulado` -> `activo` (no definido en esta fase, requiere regla administrativa futura)

## Validation Notes (Phase 1)

- No se implementa validación de suma de pagos vs `valor_total` en este feature.
- Las validaciones de negocio avanzadas quedan para fases posteriores; aquí solo integridad estructural.
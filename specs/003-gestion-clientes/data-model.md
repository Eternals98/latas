# Data Model: Gestion de Clientes

## Entity: Cliente

- **Description**: Maestro de clientes usado para asociacion en ventas y seleccion por autocompletado.
- **Source Table**: `cliente`

### Fields

- `id` (integer, PK, autoincrement)
- `nombre` (string(160), required)
- `telefono` (string(40), optional)
- `creado_en` (datetime, required)
- `modificado_en` (datetime, required)
- `estado` (string, required, default `activo`)
- `nombre_normalizado` (string, required, derivado para regla de unicidad exacta)

### Validation Rules

- `nombre` MUST be present and non-empty after trimming.
- `nombre_normalizado` MUST be unique para evitar duplicados exactos.
- `telefono` puede estar ausente.
- `estado` MUST iniciar como `activo` en creacion.

## Entity: Venta (affected relation)

- **Description**: Transaccion comercial que referencia opcionalmente un cliente.
- **Source Table**: `venta`

### Fields (relevant for this feature)

- `id` (integer, PK)
- `cliente_id` (integer, nullable, FK -> `cliente.id`)
- `creado_en` (datetime, required)
- `modificado_en` (datetime, required)

## Relationships

- `Cliente 1:N Venta`

## Aggregate-Level Business Rules

- Busqueda de clientes usa coincidencia parcial sobre `nombre`.
- Resultado de busqueda MUST estar limitado a 10 elementos.
- Busqueda MUST aplicar normalizacion de espacios en `search`.
- Resultado de busqueda MUST tener orden deterministico por relevancia y desempate por nombre ascendente.
- Creacion MUST rechazar duplicado exacto por `nombre_normalizado`.
- Coincidencias parciales de nombre NO bloquean creacion si no son exactas.

## Request/Response Contracts (Logical)

### Request: SearchClientes

- `search` (string, optional in request shape; si vacio retorna lista vacia)

### Response: SearchClientesResult

- Lista de clientes (max 10 items)
  - `id`
  - `nombre`
  - `telefono`
  - `creado_en`
  - `modificado_en`
  - `estado`

### Request: CreateCliente

- `nombre` (string, required)
- `telefono` (string, optional)

### Response: ClienteCreated

- `id`
- `nombre`
- `telefono`
- `creado_en`
- `modificado_en`
- `estado`

## State Transitions

- `Cliente` se crea en estado `activo`.
- `Cliente` actualiza `modificado_en` cuando su registro cambia.
- Este feature no contempla edicion, fusion, eliminacion ni anulacion de clientes.

# Data Model: Administracion de Ventas

## Administrador

Representa la identidad operativa autorizada para editar y anular ventas.

**Fields**:
- `username`: identificador administrativo configurado localmente.
- `password`: secreto recibido solo en login; no se persiste en texto plano.
- `activo`: indica si la credencial configurada puede iniciar sesion.

**Validation Rules**:
- `username` y `password` son obligatorios.
- Credenciales invalidas no generan token.
- No se expone el password en respuestas.

## AutorizacionAdministrativa

Permiso temporal emitido despues de un login administrativo exitoso.

**Fields**:
- `access_token`: JWT firmado para operaciones admin.
- `token_type`: valor `bearer`.
- `expires_in`: duracion en segundos; 28800 para 8 horas.
- `expires_at`: fecha/hora de expiracion para clientes que quieran mostrar vencimiento.

**Validation Rules**:
- El token debe estar firmado con el secreto local del backend.
- El token debe contener expiracion de 8 horas.
- Endpoints protegidos rechazan tokens ausentes, invalidos o vencidos.

## Venta

Registro transaccional existente que puede editarse mientras esta activo o anularse logicamente.

**Fields**:
- `id`: identificador inmutable.
- `empresa`: empresa asociada a la venta.
- `tipo`: `formal` o `informal`.
- `numero_referencia`: referencia operativa obligatoria.
- `descripcion`: detalle obligatorio de la venta.
- `valor_total`: monto total no negativo.
- `cliente_id`: cliente asociado opcional.
- `estado`: `activo` o `anulado`.
- `creado_en`: fecha/hora de creacion.
- `modificado_en`: fecha/hora de ultima modificacion.
- `pagos`: pagos asociados a la venta.

**Validation Rules**:
- `id`, `creado_en`, `estado` y marcas de auditoria no son editables por payload de actualizacion.
- Solo ventas con `estado = activo` pueden editarse.
- Una venta inexistente no se crea durante una actualizacion.
- Anular una venta cambia `estado` a `anulado` y actualiza `modificado_en`.
- Una venta anulada no vuelve a `activo` por el endpoint de anulacion.

**State Transitions**:
- `activo` -> `activo`: edicion valida de campos operativos.
- `activo` -> `anulado`: anulacion logica.
- `anulado` -> `anulado`: reintento idempotente de anulacion.
- `anulado` -> `activo`: fuera de alcance.

## Pago

Detalle de medios y montos usados para cubrir una venta.

**Fields**:
- `id`: identificador del pago.
- `venta_id`: venta asociada.
- `medio`: medio de pago obligatorio.
- `monto`: monto positivo.

**Validation Rules**:
- Cada pago debe tener `monto > 0`.
- La venta editada debe tener al menos un pago.
- La suma de pagos debe coincidir con `valor_total`.
- En una edicion, el conjunto de pagos puede reemplazarse dentro de la misma transaccion de venta.

## Cliente

Cliente asociado opcionalmente a una venta.

**Fields**:
- `id`: identificador del cliente.
- `nombre`: nombre comercial/persona.
- `telefono`: telefono opcional.

**Validation Rules**:
- Si se informa `cliente_id`, debe corresponder a un cliente existente.
- La edicion de venta no crea clientes nuevos.

## Relationships

- `Venta` 1:N `Pago`.
- `Cliente` 1:N `Venta`.
- `AutorizacionAdministrativa` autoriza operaciones sobre `Venta`, pero no se modela como relacion persistente obligatoria.

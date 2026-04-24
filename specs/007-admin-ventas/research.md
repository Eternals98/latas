# Research: Administracion de Ventas

## Decision: Credencial admin local por configuracion

**Decision**: Usar una credencial administrativa local configurada por entorno o archivo de configuracion del backend, validada solo para operaciones administrativas.

**Rationale**: La constitucion exige seguridad pragmatica y local-first. Una credencial local cubre el control requerido para edicion/anulacion sin introducir gestion completa de usuarios, base de usuarios o proveedores externos.

**Alternatives considered**:
- OAuth/SSO externo: rechazado por complejidad y por violar la fase inicial local-first.
- Tabla de administradores: diferida hasta gestion administrativa avanzada; no es necesaria para una sola credencial operativa.
- Sin login admin: rechazado porque edicion y anulacion son operaciones criticas.

## Decision: JWT firmado con expiracion de 8 horas

**Decision**: Emitir un JWT firmado para administracion con expiracion fija de 8 horas, `sub` administrativo y `scope`/claim equivalente para operaciones admin.

**Rationale**: Cumple el requisito explicito de JWT 8h y permite proteger endpoints sin estado de sesion persistido. La expiracion limita riesgo operativo en equipos compartidos.

**Alternatives considered**:
- Sesion en servidor: requiere almacenamiento y limpieza de sesiones, innecesario para LAN/offline.
- Token sin expiracion: rechazado por riesgo de acceso persistente.
- API key estatica: no cumple la expectativa de login temporal.

## Decision: Endpoints protegidos con dependencia backend reutilizable

**Decision**: Centralizar verificacion de token admin en una dependencia/servicio backend reutilizado por `PUT /api/ventas/{id}` y `DELETE /api/ventas/{id}`.

**Rationale**: Mantiene backend como fuente de verdad y evita duplicar validaciones de seguridad en cada ruta.

**Alternatives considered**:
- Validar token manualmente en cada ruta: mas repeticion y mayor riesgo de inconsistencias.
- Validacion en frontend: insuficiente porque puede ser omitida.

## Decision: Edicion de venta como reemplazo transaccional de pagos

**Decision**: La edicion permite actualizar campos operativos de `Venta` y reemplazar el conjunto de `Pago` cuando se envian pagos, validando que la suma de pagos coincida con `valor_total`.

**Rationale**: La creacion ya valida montos y pagos con esta regla. Reutilizar la misma regla evita ventas inconsistentes y simplifica el modelo de edicion.

**Alternatives considered**:
- Edicion parcial de pagos individuales: aumenta complejidad y superficie de errores.
- Permitir diferencias entre total y pagos: rechazado por consistencia de negocio.

## Decision: Anulacion logica idempotente

**Decision**: `DELETE /api/ventas/{id}` no elimina filas; cambia `Venta.estado` a `anulado`. Si la venta ya esta anulada, responde con el registro en estado final sin duplicar efectos.

**Rationale**: Cumple "no borrar fisicamente" y hace seguro el reintento de solicitudes. Conserva historico para reportes, conciliacion y trazabilidad.

**Alternatives considered**:
- Borrado fisico: rechazado por requisito explicito y trazabilidad.
- Crear una venta compensatoria: mas complejo y no pedido para esta fase.
- Error en segunda anulacion: valido, pero menos robusto ante reintentos de red.

## Decision: Reportes activos permanecen filtrados por `estado = activo`

**Decision**: Mantener listados/reportes/exportaciones operativas filtrando ventas activas. Las anuladas permanecen disponibles por identificador o consulta historica futura, pero no cuentan en resultados activos.

**Rationale**: Ya existe filtro activo en reportes y exportacion; preservarlo evita inflar totales con ventas anuladas.

**Alternatives considered**:
- Incluir anuladas en reportes por defecto: rechazado porque contradice reportes operativos.
- Crear reporte historico en esta fase: diferido para evitar ampliar alcance.

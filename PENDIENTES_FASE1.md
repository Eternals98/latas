# Pendientes Fase 1

Checklist de endurecimiento y ajustes finos pendientes después de estabilizar la base del sistema.

Estado:
- Fase 1 base del sistema: completada
- Esta lista queda para hardening y limpieza técnica posterior

## Autenticación

- [x] Sustituir la validación de sesión vía `GET /auth/v1/user` por verificación local de JWT con JWKS.
- [x] Confirmar estrategia final de roles en `profiles` y si se asignarán manualmente o por bootstrap.
- [x] Definir si el login quedará solo con email o si se habilitará algún alias interno para usuarios.

## Backend

- [x] Separar la inicialización de BD de la carga del servidor para evitar efectos secundarios en arranque.
- [x] Revisar si `init_db()` debe ejecutarse solo en local o también en producción.
- [x] Agregar manejo más explícito de errores cuando Supabase no responde o devuelve credenciales inválidas.

## Frontend

- [x] Revisar el flujo de sesión para evitar depender de cookies temporales si luego se migra a Supabase client-side completo.
- [x] Confirmar si el middleware debe seguir validando solo presencia de cookie o también expiración de sesión.
- [x] Reemplazar la UI de login temporal por una versión final alineada al producto.

## Base de datos

- [ ] Definir políticas RLS concretas para cada tabla nueva.
- [ ] Crear policies por rol para lectura/escritura según `admin` y `cashier`.
- [x] Revisar si los seeds iniciales deben estar en SQL puro o en un job de bootstrap controlado.

## Operación

- [ ] Documentar el procedimiento oficial para reiniciar la BD si se vuelve a necesitar.
- [ ] Registrar el set de variables de entorno definitivo para local, Render y Supabase.
- [ ] Validar el comportamiento del sistema con usuario `admin` real antes de avanzar a ventas.

## Próximos pasos sugeridos

1. Cerrar el flujo de autenticación definitivo.
2. Definir y aplicar policies RLS.
3. Empezar Fase 2 con ventas.

## Notas

- Se avanzó Fase 2 sobre `transactions` y se eliminó el seed automático del arranque. El resto de hardening de Fase 1 sigue pendiente.
- Login unificado con Supabase Auth por email (sin alias `username` y sin login admin separado).
- Estrategia de roles definida por `profiles` + migración de seed desde `auth.users`.
- Conexión backend preparada para Supabase pooler (plan gratuito) deshabilitando prepared statements en Postgres (`prepare_threshold: None`).
- `init_db()` restringido a SQLite local; en Supabase/Postgres el esquema se maneja solo por migraciones SQL.
- Autenticación endurecida con errores explícitos `401` (token inválido/expirado) y `503` (JWKS/servicio/DB no disponibles).
- Frontend de sesión endurecido: cookie HttpOnly de token + cookie HttpOnly de expiración (`sb_access_token_expires_at`) validada en middleware.

# Pendientes Fase 2

Checklist de trabajo pendiente para cerrar el flujo de ventas y dejarlo listo para el siguiente tramo del sistema.

## Backend ventas

- [ ] Revisar y endurecer el esquema de `POST /api/sales` para dejarlo alineado con validaciones finales de negocio.
- [ ] Agregar `GET /api/sales/:id` para ver detalle de una venta.
- [ ] Confirmar contrato final de respuesta de lista y detalle para frontend.
- [ ] Resolver manejo de errores cuando falte cliente genérico o existan catálogos incompletos.

## Frontend ventas

- [ ] Normalizar la búsqueda de clientes por nombre y teléfono con UX final.
- [ ] Revisar si el formulario debe autocompletar el teléfono desde cliente seleccionado o dejarlo editable.
- [ ] Agregar listado de ventas en `transacciones` o pantalla equivalente usando el nuevo contrato.
- [ ] Confirmar si el formulario necesita validación visual adicional para teléfonos inválidos.

## Integración

- [ ] Verificar el flujo completo contra backend real en entorno de desarrollo.
- [ ] Confirmar que `web/app/ventas` y `web/app/registro` queden apuntando a la misma pantalla final.
- [ ] Definir si se retira definitivamente `web/legacy` cuando termine la migración.

## Datos y seguridad

- [ ] Crear policies RLS concretas para `transactions`, `transaction_payments` y `audit_logs`.
- [ ] Validar que `profiles` tenga roles definitivos antes de ampliar permisos.
- [ ] Decidir si el alta de cliente genérico debe ser bootstrap controlado o creación bajo demanda.

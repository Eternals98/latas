# Diseño funcional y técnico — Sistema de ventas, caja y reportes

## 1. Contexto

Este documento define el diseño funcional y técnico para una aplicación que reemplaza un libro de ventas en Excel y lo convierte en un sistema operativo para:

- Registro de ventas
- Control de caja diaria
- Manejo de efectivo en caja y bóveda
- Gestión básica de clientes
- Reportes operativos
- Dashboard analítico
- Auditoría básica pero sustancial

## 2. Arquitectura definida

La arquitectura del sistema será:

| Capa | Tecnología |
|---|---|
| Base de datos | Supabase / PostgreSQL |
| Backend | Render |
| Frontend | Next.js en Vercel |
| Autenticación recomendada | Supabase Auth |
| Seguridad de datos | RLS en Supabase + backend obligatorio para operaciones críticas |

## 3. Decisiones arquitectónicas principales

### 3.1 Backend obligatorio para operaciones financieras críticas

Las operaciones que afectan dinero, caja, bóveda, saldos o auditoría no deben ejecutarse directamente desde el frontend.

El flujo recomendado es:

```text
Frontend Next.js
   ↓
Backend en Render
   ↓
Supabase PostgreSQL
```

Operaciones que deben pasar siempre por backend:

- Crear venta
- Registrar pagos de una venta
- Registrar entrega de efectivo
- Registrar ajustes manuales
- Registrar devoluciones
- Anular ventas
- Editar ventas
- Cerrar caja diaria

Operaciones que pueden consultarse directamente con Supabase, siempre con RLS:

- Consultar reportes
- Consultar dashboard
- Buscar clientes
- Listar empresas
- Listar métodos de pago

### 3.2 Uso de RPC / funciones SQL

Las funciones SQL o RPC son recomendables para operaciones financieras críticas porque permiten ejecutar lógica atómica dentro de PostgreSQL.

Ejemplo conceptual:

```text
Crear venta:
1. Insertar cabecera de venta
2. Insertar métodos de pago
3. Validar suma de pagos
4. Crear movimiento de caja si hay efectivo
5. Confirmar todo o revertir todo
```

Esto debe ejecutarse en una transacción.

### 3.3 Supabase Auth

Se recomienda usar Supabase Auth porque:

- Integra usuarios con PostgreSQL.
- Permite aplicar RLS.
- Reduce complejidad de autenticación propia.
- Facilita control por roles.

### 3.4 Jobs / colas

No son obligatorios en la primera versión por el volumen actual estimado de 20 a 40 transacciones diarias.

Se recomienda dejar el diseño preparado para usarlos después en:

- Refresco de dashboards pesados
- Reportes históricos
- Exportaciones masivas
- Notificaciones
- Cierres automáticos

---

## 4. Supuestos de negocio confirmados

## 4.1 Alcance

El sistema es para un solo negocio, no para un SaaS multiempresa externo.

Sin embargo, debe manejar varias empresas o libros internos:

- Latas S.A.S
- Tomás Gómez
- Genérico

Estas empresas funcionarán como unidades internas de clasificación de ventas y reportes.

## 4.2 Roles

Roles iniciales:

| Rol | Descripción |
|---|---|
| Administrador | Puede configurar, editar, anular, ajustar y cerrar caja |
| Vendedor/Cajero | Puede registrar ventas, consultar información operativa y registrar operaciones permitidas |

## 4.3 Caja

Reglas confirmadas:

- Solo existe una caja por día.
- No hay cajas simultáneas.
- El efectivo se divide en:
  - Caja
  - Bóveda
- La entrega de efectivo siempre mueve dinero desde caja hacia bóveda.
- Si el jefe recoge dinero, debe quedar registrado como salida desde caja hasta boveda, no como venta.

## 4.4 Transacciones

Tipos requeridos:

- Venta
- Entrega de efectivo
- Ajuste manual
- Devolución
- Anulación

Reglas:

- El vendedor/cajero puede crear ventas.
- Solo el administrador puede editar ventas.
- Solo el administrador puede anular ventas.
- Toda anulación debe quedar auditada.
- Toda edición relevante debe quedar auditada.

## 4.5 Métodos de pago

Reglas:

- Inicialmente solo se implementará efectivo.
- El modelo debe permitir crear métodos de pago dinámicamente.
- Los métodos distintos a efectivo no afectan caja.
- Las transferencias bancarias no afectan caja.
- Una venta puede tener uno o varios métodos de pago.
- La suma de pagos debe ser igual al total de la venta.
- Si el usuario es administrador, se puede permitir diferencia justificada, pero debe quedar auditada.

## 4.6 Clientes

Reglas:

- El cliente no es obligatorio.
- Debe existir un cliente genérico.
- Los datos mínimos del cliente son:
  - Nombre
  - Número / teléfono
- Se debe evitar duplicidad de clientes.

## 4.7 Reportes

Se requiere:

- Reporte diario oficial.
- Vista detallada.
- Vista consolidada.
- Exportación a Excel.
- Exportación a PDF.
- Dashboard en tiempo real o con retraso máximo de 1 minuto.

## 4.8 Volumen estimado

- 20 a 40 transacciones por día.
- Crecimiento futuro posible hacia CRM o ERP.
- Facturación electrónica no está contemplada por ahora.

---

# 5. Modelo de datos propuesto

## 5.1 Tabla: companies

Representa las empresas o libros internos.

```sql
create table companies (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);
```

Registros iniciales:

- Latas S.A.S
- Tomás Gómez
- Genérico

## 5.2 Tabla: profiles

Perfil interno de usuarios autenticados.

```sql
create table profiles (
    id uuid primary key references auth.users(id),
    full_name text not null,
    role text not null check (role in ('admin', 'cashier')),
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);
```

## 5.3 Tabla: customers

Gestión básica de clientes.

```sql
create table customers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text,
    normalized_phone text,
    is_generic boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz
);
```

Índice recomendado:

```sql
create unique index ux_customers_normalized_phone
on customers(normalized_phone)
where normalized_phone is not null;
```

Cliente inicial recomendado:

```text
Nombre: Cliente Genérico
Teléfono: null
is_generic: true
```

## 5.4 Tabla: payment_methods

Métodos de pago dinámicos.

```sql
create table payment_methods (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    code text not null unique,
    affects_cash boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default now()
);
```

Registro inicial:

```text
name: Efectivo
code: CASH
affects_cash: true
```

Futuro:

```text
Transferencia
Nequi
Daviplata
Tarjeta
Consignación
Otro
```

Para esos métodos:

```text
affects_cash = false
```

## 5.5 Tabla: cash_sessions

Representa el día operativo de caja.

```sql
create table cash_sessions (
    id uuid primary key default gen_random_uuid(),
    session_date date not null unique,
    opening_cash numeric(14,2) not null default 0,
    closing_cash_expected numeric(14,2),
    closing_cash_counted numeric(14,2),
    difference_amount numeric(14,2),
    status text not null check (status in ('open', 'closed')) default 'open',
    opened_by uuid references profiles(id),
    closed_by uuid references profiles(id),
    opened_at timestamptz not null default now(),
    closed_at timestamptz
);
```

Regla:

- Solo puede existir una caja abierta por día.

## 5.6 Tabla: transactions

Cabecera de transacciones.

```sql
create table transactions (
    id uuid primary key default gen_random_uuid(),
    company_id uuid not null references companies(id),
    customer_id uuid references customers(id),
    cash_session_id uuid references cash_sessions(id),

    transaction_date date not null,
    document_type text check (document_type in ('invoice', 'note', 'other')),
    document_number text,
    description text,

    transaction_type text not null check (
        transaction_type in (
            'sale',
            'cash_delivery',
            'manual_adjustment',
            'refund'
        )
    ),

    total_amount numeric(14,2) not null check (total_amount >= 0),

    status text not null check (
        status in ('confirmed', 'cancelled')
    ) default 'confirmed',

    payment_difference_amount numeric(14,2) not null default 0,
    payment_difference_reason text,

    created_by uuid references profiles(id),
    updated_by uuid references profiles(id),
    cancelled_by uuid references profiles(id),

    created_at timestamptz not null default now(),
    updated_at timestamptz,
    cancelled_at timestamptz,
    cancellation_reason text
);
```

Notas:

- Las anulaciones no deben borrar registros.
- Una venta anulada queda con status `cancelled`.
- La reversión se controla con movimientos de caja y auditoría.

## 5.7 Tabla: transaction_payments

Detalle de métodos de pago por transacción.

```sql
create table transaction_payments (
    id uuid primary key default gen_random_uuid(),
    transaction_id uuid not null references transactions(id) on delete cascade,
    payment_method_id uuid not null references payment_methods(id),
    amount numeric(14,2) not null check (amount > 0),
    created_at timestamptz not null default now()
);
```

Regla:

```text
SUM(transaction_payments.amount) debe ser igual a transactions.total_amount
```

Excepción:

```text
Solo administrador puede permitir diferencia con justificación.
```

## 5.8 Tabla: cash_movements

Controla los movimientos reales de efectivo.

```sql
create table cash_movements (
    id uuid primary key default gen_random_uuid(),
    transaction_id uuid references transactions(id),
    cash_session_id uuid not null references cash_sessions(id),
    movement_date date not null,

    movement_type text not null check (
        movement_type in (
            'cash_in',
            'cash_out',
            'vault_in',
            'vault_out',
            'adjustment_in',
            'adjustment_out',
            'reversal'
        )
    ),

    amount numeric(14,2) not null check (amount > 0),
    description text,
    created_by uuid references profiles(id),
    created_at timestamptz not null default now()
);
```

Reglas:

- Venta en efectivo genera `cash_in`.
- Entrega genera:
  - `cash_out`
  - `vault_in`
- Retiro del jefe desde bóveda genera:
  - `vault_out`
- Anulación de venta en efectivo genera movimiento de reverso.

## 5.9 Tabla: audit_logs

Auditoría básica pero sustancial.

```sql
create table audit_logs (
    id uuid primary key default gen_random_uuid(),
    entity_name text not null,
    entity_id uuid not null,
    action text not null,
    old_data jsonb,
    new_data jsonb,
    reason text,
    created_by uuid references profiles(id),
    created_at timestamptz not null default now()
);
```

Acciones sugeridas:

```text
CREATE_SALE
UPDATE_SALE
CANCEL_SALE
CREATE_CASH_DELIVERY
CREATE_MANUAL_ADJUSTMENT
CLOSE_CASH_SESSION
CREATE_PAYMENT_METHOD
```

---

# 6. Relaciones principales

```text
companies 1 ─── N transactions

customers 1 ─── N transactions

cash_sessions 1 ─── N transactions

transactions 1 ─── N transaction_payments

payment_methods 1 ─── N transaction_payments

cash_sessions 1 ─── N cash_movements

transactions 1 ─── N cash_movements

profiles 1 ─── N transactions
profiles 1 ─── N cash_movements
profiles 1 ─── N audit_logs
```

---

# 7. Reglas de negocio

## 7.1 Registro de venta

Una venta debe cumplir:

- Empresa obligatoria.
- Fecha obligatoria.
- Total mayor o igual a cero.
- Al menos un método de pago.
- Suma de pagos igual al total.
- Si hay efectivo, se registra movimiento de caja.
- Si no hay cliente, se asigna cliente genérico.

## 7.2 Métodos de pago

Reglas:

- El método efectivo afecta caja.
- Los métodos bancarios no afectan caja.
- El sistema debe permitir crear nuevos métodos.
- No se deben eliminar métodos con historial; solo desactivarlos.

## 7.3 Entrega de efectivo

Una entrega representa traslado de caja a bóveda.

Debe generar dos movimientos:

```text
cash_out  desde caja
vault_in  hacia bóveda
```

No debe registrarse como venta.

## 7.4 Retiro del jefe

Si el jefe recoge efectivo desde bóveda, debe registrarse como:

```text
vault_out
```

Debe solicitar:

- Monto
- Fecha
- Usuario
- Observación

## 7.5 Ajustes manuales

Solo administrador.

Debe solicitar:

- Tipo de ajuste
- Monto
- Motivo obligatorio

## 7.6 Devoluciones

Una devolución no debe borrar la venta original.

Debe registrarse como transacción tipo `refund` asociada o referenciada a la venta original si se requiere trazabilidad avanzada.

## 7.7 Anulación

Solo administrador.

Debe:

- Cambiar estado a `cancelled`.
- Registrar motivo.
- Registrar usuario.
- Registrar fecha.
- Revertir impacto en caja si la venta tuvo efectivo.
- Crear registro en `audit_logs`.

---

# 8. Cálculos de caja

## 8.1 Efectivo total vendido

```sql
select coalesce(sum(tp.amount), 0)
from transaction_payments tp
join payment_methods pm on pm.id = tp.payment_method_id
join transactions t on t.id = tp.transaction_id
where pm.affects_cash = true
and t.status = 'confirmed'
and t.transaction_type = 'sale'
and t.transaction_date = current_date;
```

## 8.2 Efectivo en caja

Fórmula lógica:

```text
Efectivo en caja =
Apertura de caja
+ entradas de efectivo
- salidas de efectivo
+ ajustes de entrada
- ajustes de salida
- reversos aplicables
```

## 8.3 Efectivo en bóveda

Fórmula lógica:

```text
Efectivo en bóveda =
Entradas a bóveda
- salidas de bóveda
```

## 8.4 Consistencia

Debe cumplirse:

```text
Efectivo total operativo = efectivo en caja + efectivo en bóveda
```

Dependiendo de si el retiro del jefe sale del sistema, el sistema debe distinguir:

```text
Bóveda actual
Dinero retirado históricamente
```

---

# 9. Vistas recomendadas para reporting

## 9.1 Vista: ventas diarias

```sql
create view view_daily_sales as
select
    t.transaction_date,
    t.company_id,
    c.name as company_name,
    count(*) as transaction_count,
    sum(t.total_amount) as total_sales
from transactions t
join companies c on c.id = t.company_id
where t.transaction_type = 'sale'
and t.status = 'confirmed'
group by t.transaction_date, t.company_id, c.name;
```

## 9.2 Vista: recaudo por método de pago

```sql
create view view_collections_by_payment_method as
select
    t.transaction_date,
    pm.id as payment_method_id,
    pm.name as payment_method_name,
    sum(tp.amount) as total_amount
from transaction_payments tp
join payment_methods pm on pm.id = tp.payment_method_id
join transactions t on t.id = tp.transaction_id
where t.status = 'confirmed'
group by t.transaction_date, pm.id, pm.name;
```

## 9.3 Vista: dashboard por empresa

```sql
create view view_dashboard_company_sales as
select
    c.id as company_id,
    c.name as company_name,
    count(t.id) as transaction_count,
    coalesce(sum(t.total_amount), 0) as total_sales
from companies c
left join transactions t on t.company_id = c.id
    and t.transaction_type = 'sale'
    and t.status = 'confirmed'
group by c.id, c.name;
```

## 9.4 Vista: ventas por día de la semana

```sql
create view view_sales_by_weekday as
select
    extract(isodow from transaction_date) as weekday_number,
    to_char(transaction_date, 'Day') as weekday_name,
    count(*) as transaction_count,
    sum(total_amount) as total_sales
from transactions
where transaction_type = 'sale'
and status = 'confirmed'
group by extract(isodow from transaction_date), to_char(transaction_date, 'Day');
```

---

# 10. Índices recomendados

```sql
create index idx_transactions_date
on transactions(transaction_date);

create index idx_transactions_company_date
on transactions(company_id, transaction_date);

create index idx_transactions_customer
on transactions(customer_id);

create index idx_transactions_document_number
on transactions(document_number);

create index idx_transactions_type_status
on transactions(transaction_type, status);

create index idx_transaction_payments_transaction
on transaction_payments(transaction_id);

create index idx_transaction_payments_method
on transaction_payments(payment_method_id);

create index idx_cash_movements_session
on cash_movements(cash_session_id);

create index idx_cash_movements_date
on cash_movements(movement_date);

create index idx_audit_logs_entity
on audit_logs(entity_name, entity_id);
```

---

# 11. RLS y seguridad

## 11.1 Principio general

Todas las tablas sensibles deben tener RLS activado.

```sql
alter table profiles enable row level security;
alter table companies enable row level security;
alter table customers enable row level security;
alter table payment_methods enable row level security;
alter table cash_sessions enable row level security;
alter table transactions enable row level security;
alter table transaction_payments enable row level security;
alter table cash_movements enable row level security;
alter table audit_logs enable row level security;
```

## 11.2 Recomendación práctica

Como el sistema es de un solo negocio, no se requiere multi-tenant complejo.

Se recomienda manejar acceso por rol:

- Administrador:
  - Lectura completa.
  - Escritura controlada.
  - Anulación.
  - Ajustes.
  - Cierre de caja.
- Vendedor/Cajero:
  - Crear ventas.
  - Consultar ventas propias o del día.
  - Consultar caja diaria.
  - No puede anular.
  - No puede editar ventas confirmadas.

## 11.3 Escrituras financieras

Las escrituras críticas deben pasar por backend usando service role o RPC controladas.

El frontend nunca debe tener:

```text
SUPABASE_SERVICE_ROLE_KEY
```

Esta llave debe vivir únicamente en Render como variable de entorno segura.

---

# 12. APIs recomendadas

## 12.1 Ventas

```http
POST /api/sales
GET  /api/sales
GET  /api/sales/:id
PUT  /api/sales/:id
POST /api/sales/:id/cancel
```

Reglas:

- `POST /api/sales`: vendedor y administrador.
- `PUT /api/sales/:id`: solo administrador.
- `POST /api/sales/:id/cancel`: solo administrador.

## 12.2 Caja

```http
POST /api/cash/open
POST /api/cash/delivery
POST /api/cash/vault-withdrawal
POST /api/cash/adjustment
POST /api/cash/close
GET  /api/cash/today
GET  /api/cash/history
```

## 12.3 Clientes

```http
GET  /api/customers
POST /api/customers
PUT  /api/customers/:id
```

## 12.4 Métodos de pago

```http
GET  /api/payment-methods
POST /api/payment-methods
PUT  /api/payment-methods/:id
```

## 12.5 Reportes

```http
GET /api/reports/daily
GET /api/reports/daily/detail
GET /api/reports/daily/summary
GET /api/reports/collections
GET /api/reports/history
GET /api/reports/export/excel
GET /api/reports/export/pdf
```

## 12.6 Dashboard

```http
GET /api/dashboard/summary
GET /api/dashboard/sales-by-weekday
GET /api/dashboard/income-by-company
GET /api/dashboard/transactions-by-company
GET /api/dashboard/income-by-payment-method
```

---

# 13. Validaciones críticas

## 13.1 Crear venta

Validaciones:

- Usuario autenticado.
- Usuario activo.
- Rol permitido.
- Empresa activa.
- Cliente existente o cliente genérico.
- Total mayor o igual a cero.
- Al menos un pago.
- Métodos de pago activos.
- Suma de pagos igual al total.
- Si hay diferencia:
  - Solo administrador.
  - Justificación obligatoria.
- Caja del día abierta.
- Si hay efectivo, registrar movimiento `cash_in`.

## 13.2 Editar venta

Solo administrador.

Debe validar:

- La venta no esté anulada.
- La caja no esté cerrada, o si está cerrada, registrar ajuste autorizado.
- Motivo obligatorio.
- Auditoría obligatoria.

## 13.3 Anular venta

Solo administrador.

Debe validar:

- Venta existente.
- Venta confirmada.
- Motivo obligatorio.
- Reversión de caja si afectó efectivo.
- Auditoría obligatoria.

## 13.4 Entrega de efectivo

Validaciones:

- Caja abierta.
- Monto mayor a cero.
- Monto disponible en caja suficiente.
- Registrar `cash_out`.
- Registrar `vault_in`.
- Auditoría.

## 13.5 Cierre de caja

Validaciones:

- Caja abierta.
- No permitir más ventas después del cierre sin reapertura administrativa.
- Solicitar efectivo contado.
- Calcular diferencia.
- Guardar cierre.
- Registrar usuario y fecha.

---

# 14. Flujo de datos

## 14.1 Crear venta

```text
1. Usuario ingresa venta desde Next.js.
2. Frontend envía request al backend.
3. Backend valida sesión, rol y payload.
4. Backend llama RPC o ejecuta transacción SQL.
5. PostgreSQL crea venta, pagos y movimientos.
6. PostgreSQL confirma o revierte todo.
7. Backend responde éxito/error.
8. Frontend actualiza vista.
```

## 14.2 Registrar entrega

```text
1. Usuario ingresa monto de entrega.
2. Backend valida caja abierta y saldo disponible.
3. Se crea transacción operativa.
4. Se crea cash_out.
5. Se crea vault_in.
6. Se actualiza reporte de caja.
```

## 14.3 Cerrar caja

```text
1. Administrador ingresa efectivo contado.
2. Sistema calcula efectivo esperado.
3. Sistema calcula diferencia.
4. Administrador confirma cierre.
5. Caja queda cerrada.
6. Se bloquean cambios ordinarios del día.
```

---

# 15. Reporting y dashboard

## 15.1 En tiempo real

Por el volumen estimado, las consultas pueden ejecutarse directamente sobre vistas SQL.

No se requiere materialized view inicialmente.

## 15.2 Delay máximo de 1 minuto

Si luego el dashboard se vuelve pesado, se recomienda:

- Tabla `dashboard_snapshots`
- Job cada 1 minuto
- Refresco incremental
- Materialized views

## 15.3 Exportaciones

Excel:

- Generado desde backend.
- Ideal para reporte diario y reportes históricos.

PDF:

- Generado desde backend.
- Debe reflejar cierres oficiales y reportes consolidados.

---

# 16. Normalización vs performance

## 16.1 Normalización

El modelo debe mantenerse normalizado para:

- Evitar columnas dinámicas por método de pago.
- Permitir crecimiento de métodos de pago.
- Facilitar reportes.
- Evitar duplicidad de clientes.
- Controlar caja con movimientos trazables.

## 16.2 Performance

Con 20 a 40 transacciones diarias, PostgreSQL soportará sin problema el modelo normalizado.

Optimización recomendada:

- Índices.
- Vistas SQL.
- Filtros por fecha.
- Evitar consultar todo el histórico en dashboards.

Materialized views no son necesarias en fase inicial.

---

# 17. Plan de trabajo por fases

## Fase 1 — Base del sistema

Objetivo: tener la estructura mínima operativa.

Entregables:

- Configuración Supabase.
- Modelo de datos.
- Roles iniciales.
- Empresas iniciales.
- Cliente genérico.
- Método de pago efectivo.
- Autenticación con Supabase Auth.
- Backend base en Render.
- Frontend base en Next.js.

Estado:

- Completada en esta iteración.

## Fase 2 — Ventas

Objetivo: reemplazar el Excel de ventas.

Entregables:

- Crear venta.
- Múltiples métodos de pago.
- Validación suma pagos = total.
- Relación con empresa.
- Relación con cliente.
- Listado de ventas.
- Filtros básicos.
- Auditoría de creación.

## Fase 3 — Caja

Objetivo: controlar efectivo diario.

Entregables:

- Apertura de caja.
- Registro de venta en efectivo.
- Entrega de efectivo.
- Caja y bóveda.
- Retiro desde bóveda.
- Ajuste manual.
- Saldo esperado en caja.
- Saldo en bóveda.

## Fase 4 — Administración

Objetivo: control administrativo.

Entregables:

- Edición de ventas solo por administrador.
- Anulación con motivo.
- Auditoría de cambios.
- Métodos de pago dinámicos.
- Gestión básica de clientes.
- Prevención de duplicados.

## Fase 5 — Reportes

Objetivo: reportería diaria e histórica.

Entregables:

- Reporte diario detallado.
- Reporte diario consolidado.
- Recaudos por método de pago.
- Histórico por empresa.
- Histórico por cliente.
- Histórico por factura.
- Exportación a Excel.
- Exportación a PDF.

## Fase 6 — Dashboard

Objetivo: visualización analítica.

Entregables:

- Ventas por día de la semana.
- Ingresos por empresa.
- Transacciones por empresa.
- Ingresos por método de pago.
- KPIs de efectivo.
- Caja vs bóveda.
- Top clientes.

## Fase 7 — Endurecimiento

Objetivo: robustez y seguridad.

Entregables:

- RLS final.
- Validaciones backend.
- Validaciones SQL/RPC.
- Logs.
- Manejo de errores.
- Pruebas funcionales.
- Pruebas de consistencia financiera.

---

# 18. Orden recomendado de implementación

1. Crear modelo de datos.
2. Configurar Supabase Auth.
3. Crear perfiles y roles.
4. Insertar empresas iniciales.
5. Insertar cliente genérico.
6. Insertar método de pago efectivo.
7. Crear backend base.
8. Crear endpoint de venta.
9. Crear lógica transaccional para venta.
10. Crear frontend de venta.
11. Crear caja diaria.
12. Crear entrega de efectivo.
13. Crear reportes diarios.
14. Crear dashboard.
15. Crear auditoría y anulación.
16. Crear exportaciones.

---

# 19. Riesgos y controles

## 19.1 Riesgo: ventas con pagos incompletos

Control:

- Operación transaccional.
- Validación backend.
- Validación SQL.

## 19.2 Riesgo: efectivo inconsistente

Control:

- No actualizar saldos manualmente.
- Calcular desde movimientos.
- Registrar ajustes con motivo.

## 19.3 Riesgo: anulación sin trazabilidad

Control:

- No borrar registros.
- Usar status `cancelled`.
- Crear audit log.
- Crear reversos de caja.

## 19.4 Riesgo: usuarios modificando información crítica

Control:

- Roles.
- Backend obligatorio.
- RLS.
- Auditoría.

## 19.5 Riesgo: clientes duplicados

Control:

- Normalizar teléfono.
- Índice único.
- Búsqueda antes de crear.

---

# 20. Conclusión

El diseño recomendado no debe replicar el Excel como una tabla plana.

Debe modelarse como un sistema transaccional compuesto por:

```text
Ventas
Pagos
Caja
Bóveda
Clientes
Auditoría
Reportes derivados
```

La decisión más importante es mantener separadas:

- La venta
- Los métodos de pago
- Los movimientos de efectivo

Esto permite que el sistema crezca hacia CRM o ERP sin rediseñar la base.

La arquitectura recomendada es:

```text
Next.js para interfaz
Backend en Render para escrituras críticas
Supabase PostgreSQL para persistencia, seguridad y reporting
RLS para control de acceso
RPC SQL para operaciones atómicas
```

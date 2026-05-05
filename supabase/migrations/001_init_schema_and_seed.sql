-- Legacy cleanup (run manually before applying this schema in existing projects)
-- drop table if exists public.pago;
-- drop table if exists public.venta;
-- drop table if exists public.medio_pago;
-- drop table if exists public.cliente;
-- drop table if exists public.admin_user;

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin', 'cashier')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  normalized_phone text,
  is_generic boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create unique index if not exists ux_customers_normalized_phone
on public.customers(normalized_phone)
where normalized_phone is not null;

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  affects_cash boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  session_date date not null unique,
  opening_cash numeric(14,2) not null default 0,
  closing_cash_expected numeric(14,2),
  closing_cash_counted numeric(14,2),
  difference_amount numeric(14,2),
  status text not null check (status in ('open', 'closed')) default 'open',
  opened_by uuid references public.profiles(id),
  closed_by uuid references public.profiles(id),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.cash_events (
  id uuid primary key default gen_random_uuid(),
  cash_session_id uuid not null references public.cash_sessions(id) on delete cascade,
  event_type text not null check (event_type in ('open', 'close', 'delivery', 'reopen')),
  actor_id uuid not null references public.profiles(id),
  event_at timestamptz not null default now(),
  payload jsonb,
  note text
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  customer_id uuid references public.customers(id),
  cash_session_id uuid references public.cash_sessions(id),
  transaction_date date not null,
  document_type text check (document_type in ('invoice', 'note', 'other')),
  document_number text,
  description text,
  transaction_type text not null check (transaction_type in ('sale', 'cash_delivery', 'manual_adjustment', 'refund')),
  total_amount numeric(14,2) not null check (total_amount >= 0),
  status text not null check (status in ('confirmed', 'cancelled')) default 'confirmed',
  payment_difference_amount numeric(14,2) not null default 0,
  payment_difference_reason text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  cancelled_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text
);

create table if not exists public.transaction_payments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  payment_method_id uuid not null references public.payment_methods(id),
  amount numeric(14,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references public.transactions(id),
  cash_session_id uuid not null references public.cash_sessions(id),
  movement_date date not null,
  movement_type text not null check (movement_type in ('cash_in', 'cash_out', 'vault_in', 'vault_out', 'adjustment_in', 'adjustment_out', 'reversal')),
  amount numeric(14,2) not null check (amount > 0),
  description text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_name text not null,
  entity_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_date on public.transactions(transaction_date);
create index if not exists idx_transactions_company_date on public.transactions(company_id, transaction_date);
create index if not exists idx_transactions_customer on public.transactions(customer_id);
create index if not exists idx_transactions_document_number on public.transactions(document_number);
create index if not exists idx_transactions_type_status on public.transactions(transaction_type, status);
create index if not exists idx_transaction_payments_transaction on public.transaction_payments(transaction_id);
create index if not exists idx_transaction_payments_method on public.transaction_payments(payment_method_id);
create index if not exists idx_cash_movements_session on public.cash_movements(cash_session_id);
create index if not exists idx_cash_movements_date on public.cash_movements(movement_date);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_name, entity_id);
create index if not exists idx_cash_events_session on public.cash_events(cash_session_id);
create index if not exists idx_cash_events_event_at on public.cash_events(event_at);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.customers enable row level security;
alter table public.payment_methods enable row level security;
alter table public.cash_sessions enable row level security;
alter table public.cash_events enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_payments enable row level security;
alter table public.cash_movements enable row level security;
alter table public.audit_logs enable row level security;

alter table public.profiles force row level security;
alter table public.companies force row level security;
alter table public.customers force row level security;
alter table public.payment_methods force row level security;
alter table public.cash_sessions force row level security;
alter table public.cash_events force row level security;
alter table public.transactions force row level security;
alter table public.transaction_payments force row level security;
alter table public.cash_movements force row level security;
alter table public.audit_logs force row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_active_role(expected_role text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role = expected_role
  );
$$;

drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists companies_read_authenticated on public.companies;
create policy companies_read_authenticated
on public.companies
for select
to authenticated
using (public.current_user_role() in ('admin', 'cashier') and is_active = true);

drop policy if exists customers_read_authenticated on public.customers;
create policy customers_read_authenticated
on public.customers
for select
to authenticated
using (public.current_user_role() in ('admin', 'cashier') and is_active = true);

drop policy if exists payment_methods_read_authenticated on public.payment_methods;
create policy payment_methods_read_authenticated
on public.payment_methods
for select
to authenticated
using (public.current_user_role() in ('admin', 'cashier') and is_active = true);

drop policy if exists cash_sessions_select_admin_or_cashier on public.cash_sessions;
create policy cash_sessions_select_admin_or_cashier
on public.cash_sessions
for select
to authenticated
using (public.current_user_role() in ('admin', 'cashier'));

drop policy if exists cash_sessions_insert_admin_only on public.cash_sessions;
create policy cash_sessions_insert_admin_only
on public.cash_sessions
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'
  and opened_by = auth.uid()
);

drop policy if exists cash_sessions_update_admin_only on public.cash_sessions;
create policy cash_sessions_update_admin_only
on public.cash_sessions
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists cash_movements_select_admin_or_cashier on public.cash_movements;
create policy cash_movements_select_admin_or_cashier
on public.cash_movements
for select
to authenticated
using (public.current_user_role() in ('admin', 'cashier'));

drop policy if exists cash_movements_insert_admin_or_cashier on public.cash_movements;
create policy cash_movements_insert_admin_or_cashier
on public.cash_movements
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.current_user_role() in ('admin', 'cashier')
);

drop policy if exists cash_movements_update_admin_only on public.cash_movements;
create policy cash_movements_update_admin_only
on public.cash_movements
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists cash_movements_delete_admin_only on public.cash_movements;
create policy cash_movements_delete_admin_only
on public.cash_movements
for delete
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists transactions_select_admin_or_cashier on public.transactions;
create policy transactions_select_admin_or_cashier
on public.transactions
for select
to authenticated
using (public.current_user_role() in ('admin', 'cashier'));

drop policy if exists transactions_insert_admin_or_cashier on public.transactions;
create policy transactions_insert_admin_or_cashier
on public.transactions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role in ('admin', 'cashier')
  )
  and transaction_type = 'sale'
  and status = 'confirmed'
);

drop policy if exists transactions_update_admin_only on public.transactions;
create policy transactions_update_admin_only
on public.transactions
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists transactions_delete_admin_only on public.transactions;
create policy transactions_delete_admin_only
on public.transactions
for delete
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists transaction_payments_select_admin_or_cashier on public.transaction_payments;
create policy transaction_payments_select_admin_or_cashier
on public.transaction_payments
for select
to authenticated
using (public.current_user_role() in ('admin', 'cashier'));

drop policy if exists transaction_payments_insert_admin_or_cashier on public.transaction_payments;
create policy transaction_payments_insert_admin_or_cashier
on public.transaction_payments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.transactions t
    join public.profiles p on p.id = auth.uid()
    where t.id = transaction_id
      and p.is_active = true
      and p.role in ('admin', 'cashier')
  )
);

drop policy if exists transaction_payments_update_admin_only on public.transaction_payments;
create policy transaction_payments_update_admin_only
on public.transaction_payments
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists transaction_payments_delete_admin_only on public.transaction_payments;
create policy transaction_payments_delete_admin_only
on public.transaction_payments
for delete
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists audit_logs_select_admin_or_cashier on public.audit_logs;
create policy audit_logs_select_admin_or_cashier
on public.audit_logs
for select
to authenticated
using (public.current_user_role() in ('admin', 'cashier'));

drop policy if exists audit_logs_insert_admin_or_cashier on public.audit_logs;
create policy audit_logs_insert_admin_or_cashier
on public.audit_logs
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role in ('admin', 'cashier')
  )
);

drop policy if exists audit_logs_update_admin_only on public.audit_logs;
create policy audit_logs_update_admin_only
on public.audit_logs
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists audit_logs_delete_admin_only on public.audit_logs;
create policy audit_logs_delete_admin_only
on public.audit_logs
for delete
to authenticated
using (public.current_user_role() = 'admin');

drop policy if exists cash_events_select_admin_or_cashier on public.cash_events;
create policy cash_events_select_admin_or_cashier
on public.cash_events
for select
to authenticated
using (public.current_user_role() in ('admin', 'cashier'));

drop policy if exists cash_events_insert_admin_or_cashier on public.cash_events;
create policy cash_events_insert_admin_or_cashier
on public.cash_events
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role in ('admin', 'cashier')
  )
);

drop policy if exists cash_events_update_admin_only on public.cash_events;
create policy cash_events_update_admin_only
on public.cash_events
for update
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

drop policy if exists cash_events_delete_admin_only on public.cash_events;
create policy cash_events_delete_admin_only
on public.cash_events
for delete
to authenticated
using (public.current_user_role() = 'admin');

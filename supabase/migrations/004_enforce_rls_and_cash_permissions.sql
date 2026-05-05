-- Existing-project migration.
-- Enforces RLS/policies on the current Supabase schema and locks down cash tables.

begin;

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

alter table if exists public.profiles enable row level security;
alter table if exists public.companies enable row level security;
alter table if exists public.customers enable row level security;
alter table if exists public.payment_methods enable row level security;
alter table if exists public.cash_sessions enable row level security;
alter table if exists public.cash_events enable row level security;
alter table if exists public.transactions enable row level security;
alter table if exists public.transaction_payments enable row level security;
alter table if exists public.cash_movements enable row level security;
alter table if exists public.audit_logs enable row level security;

alter table if exists public.profiles force row level security;
alter table if exists public.companies force row level security;
alter table if exists public.customers force row level security;
alter table if exists public.payment_methods force row level security;
alter table if exists public.cash_sessions force row level security;
alter table if exists public.cash_events force row level security;
alter table if exists public.transactions force row level security;
alter table if exists public.transaction_payments force row level security;
alter table if exists public.cash_movements force row level security;
alter table if exists public.audit_logs force row level security;

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
with check (public.current_user_role() = 'admin' and opened_by = auth.uid());

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
with check (created_by = auth.uid() and public.current_user_role() in ('admin', 'cashier'));

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

commit;

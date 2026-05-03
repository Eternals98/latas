-- Performance and safety hardening for search and cash invariants.

begin;

create extension if not exists pg_trgm;

create index if not exists idx_customers_name_trgm
  on public.customers
  using gin (name gin_trgm_ops);

create index if not exists idx_customers_phone_trgm
  on public.customers
  using gin (phone gin_trgm_ops);

create index if not exists idx_transactions_document_number_trgm
  on public.transactions
  using gin (document_number gin_trgm_ops);

alter table if exists public.cash_movements
  add column if not exists admin_reason text;

create or replace function public.fn_enforce_transaction_invariants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  session_status text;
  session_date_value date;
begin
  if new.created_by is distinct from auth.uid() then
    raise exception 'created_by must match current user';
  end if;

  if new.transaction_type <> 'sale' or new.status <> 'confirmed' then
    raise exception 'Only confirmed sales can be inserted';
  end if;

  if new.cash_session_id is not null then
    select cs.status, cs.session_date
      into session_status, session_date_value
    from public.cash_sessions cs
    where cs.id = new.cash_session_id;

    if session_status is distinct from 'open' then
      raise exception 'Cash session must be open';
    end if;

    if session_date_value is distinct from new.transaction_date then
      raise exception 'Transaction date must match cash session date';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.fn_enforce_cash_movement_invariants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  session_status text;
  session_date_value date;
begin
  actor_role := public.current_user_role();

  if tg_op = 'INSERT' then
    if new.created_by is distinct from auth.uid() then
      raise exception 'created_by must match current user';
    end if;

    select cs.status, cs.session_date
      into session_status, session_date_value
    from public.cash_sessions cs
    where cs.id = new.cash_session_id;

    if session_status is distinct from 'open' then
      raise exception 'Cash movement requires an open cash session';
    end if;

    if session_date_value is distinct from new.movement_date then
      raise exception 'Movement date must match cash session date';
    end if;

    return new;
  end if;

  select cs.status
    into session_status
  from public.cash_sessions cs
  where cs.id = old.cash_session_id;

  if session_status is distinct from 'open' and actor_role <> 'admin' then
    raise exception 'Closed cash movements can only be modified by admin';
  end if;

  insert into public.audit_logs (
    id,
    entity_name,
    entity_id,
    action,
    old_data,
    new_data,
    reason,
    created_by,
    created_at
  )
  values (
    gen_random_uuid(),
    'cash_movements',
    old.id,
    case when tg_op = 'DELETE' then 'DELETE_CASH_MOVEMENT' else 'UPDATE_CASH_MOVEMENT' end,
    to_jsonb(old),
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    case when tg_op = 'DELETE' then old.admin_reason else new.admin_reason end,
    auth.uid(),
    now()
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_enforce_transaction_invariants on public.transactions;
create trigger trg_enforce_transaction_invariants
before insert
on public.transactions
for each row
execute function public.fn_enforce_transaction_invariants();

drop trigger if exists trg_enforce_cash_movement_invariants on public.cash_movements;
create trigger trg_enforce_cash_movement_invariants
before insert or update or delete
on public.cash_movements
for each row
execute function public.fn_enforce_cash_movement_invariants();

commit;

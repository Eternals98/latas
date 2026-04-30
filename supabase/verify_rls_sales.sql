-- Verificación automática de RLS para fase 2 (sales)
-- Uso:
-- 1) Ejecuta este script en Supabase SQL Editor con rol postgres.
-- 2) Reemplaza los UUID de admin/cashier por usuarios reales que existan en public.profiles.
-- 3) Revisa el resultset final: expected_ok=true y ok=true en todos los casos.

begin;

create or replace function public._rls_test_add_result(
  test_name text,
  expected_ok boolean,
  ok boolean,
  error_text text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into pg_temp.rls_test_results values (test_name, expected_ok, ok, error_text);
end;
$$;

do $$
declare
  -- TODO: reemplazar por UUID reales existentes en public.profiles
  admin_uid uuid := '25cde06a-a833-4de8-9ae0-7a94c71b5fa3';
  cashier_uid uuid := 'bc060e7b-84e8-49fd-bebc-1e5ae4440d05';

  v_company_id uuid;
  v_customer_id uuid;
  v_payment_method_id uuid;
  v_seed_tx_id uuid;
  v_tx_id uuid;
begin
  perform set_config('row_security', 'on', true);

  if not exists (
    select 1 from public.profiles p where p.id = admin_uid and p.role = 'admin' and p.is_active = true
  ) then
    raise exception 'Admin profile no existe o no está activo: %', admin_uid;
  end if;

  if not exists (
    select 1 from public.profiles p where p.id = cashier_uid and p.role = 'cashier' and p.is_active = true
  ) then
    raise exception 'Cashier profile no existe o no está activo: %', cashier_uid;
  end if;

  select c.id into v_company_id
  from public.companies c
  where c.is_active = true
  order by c.created_at asc
  limit 1;

  if v_company_id is null then
    raise exception 'No hay company activa para pruebas.';
  end if;

  select c.id into v_customer_id
  from public.customers c
  where c.is_active = true
  order by c.is_generic desc, c.created_at asc
  limit 1;

  if v_customer_id is null then
    raise exception 'No hay customer activo para pruebas.';
  end if;

  select pm.id into v_payment_method_id
  from public.payment_methods pm
  where pm.is_active = true
  order by pm.created_at asc
  limit 1;

  if v_payment_method_id is null then
    raise exception 'No hay payment_method activo para pruebas.';
  end if;

  insert into public.transactions (
    id, company_id, customer_id, cash_session_id, transaction_date, document_type, document_number,
    description, transaction_type, total_amount, status, payment_difference_amount, payment_difference_reason,
    created_by, updated_by, cancelled_by, created_at, updated_at, cancelled_at, cancellation_reason
  ) values (
    gen_random_uuid(), v_company_id, v_customer_id, null, current_date, 'other', 'RLS-SEED-001',
    'RLS seed transaction', 'sale', 1000.00, 'confirmed', 0, null,
    admin_uid, admin_uid, null, now(), now(), null, null
  )
  returning id into v_seed_tx_id;

  create temporary table if not exists pg_temp.rls_test_results (
    test_name text not null,
    expected_ok boolean not null,
    ok boolean not null,
    error_text text
  ) on commit drop;

  truncate table pg_temp.rls_test_results;

  -- ---------- CASHIER ----------
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', cashier_uid::text, true);
  set local role authenticated;

  begin
    perform count(*) from public.transactions;
    perform public._rls_test_add_result('cashier_select_transactions', true, true, null);
  exception when others then
    perform public._rls_test_add_result('cashier_select_transactions', true, false, sqlerrm);
  end;

  begin
    insert into public.transactions (
      id, company_id, customer_id, cash_session_id, transaction_date, document_type, document_number,
      description, transaction_type, total_amount, status, payment_difference_amount, payment_difference_reason,
      created_by, updated_by, cancelled_by, created_at, updated_at, cancelled_at, cancellation_reason
    ) values (
      gen_random_uuid(), v_company_id, v_customer_id, null, current_date, 'other', 'RLS-CASHIER-001',
      'RLS cashier insert', 'sale', 1000.00, 'confirmed', 0, null,
      cashier_uid, cashier_uid, null, now(), now(), null, null
    )
    returning id into v_tx_id;
    perform public._rls_test_add_result('cashier_insert_transaction_sale', true, true, null);
  exception when others then
    perform public._rls_test_add_result('cashier_insert_transaction_sale', true, false, sqlerrm);
  end;

  begin
    insert into public.transaction_payments (id, transaction_id, payment_method_id, amount, created_at)
    values (gen_random_uuid(), v_seed_tx_id, v_payment_method_id, 1000.00, now());
    perform public._rls_test_add_result('cashier_insert_transaction_payment', true, true, null);
  exception when others then
    perform public._rls_test_add_result('cashier_insert_transaction_payment', true, false, sqlerrm);
  end;

  begin
    update public.transactions
    set description = 'RLS cashier update blocked'
    where id = v_seed_tx_id;
    perform public._rls_test_add_result('cashier_update_transaction_denied', false, true, null);
  exception when others then
    perform public._rls_test_add_result('cashier_update_transaction_denied', false, false, sqlerrm);
  end;

  begin
    insert into public.audit_logs (
      id, entity_name, entity_id, action, old_data, new_data, reason, created_by, created_at
    ) values (
      gen_random_uuid(), 'transactions', coalesce(v_tx_id, gen_random_uuid()),
      'RLS_TEST_CASHIER', null, jsonb_build_object('ok', true), 'cashier test', cashier_uid, now()
    );
    perform public._rls_test_add_result('cashier_insert_audit_log', true, true, null);
  exception when others then
    perform public._rls_test_add_result('cashier_insert_audit_log', true, false, sqlerrm);
  end;

  reset role;

  -- ---------- ADMIN ----------
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config('request.jwt.claim.sub', admin_uid::text, true);
  set local role authenticated;

  begin
    perform count(*) from public.transactions;
    perform public._rls_test_add_result('admin_select_transactions', true, true, null);
  exception when others then
    perform public._rls_test_add_result('admin_select_transactions', true, false, sqlerrm);
  end;

  begin
    update public.transactions
    set description = 'RLS admin update allowed'
    where id = v_seed_tx_id;
    perform public._rls_test_add_result('admin_update_transaction', true, true, null);
  exception when others then
    perform public._rls_test_add_result('admin_update_transaction', true, false, sqlerrm);
  end;

  begin
    delete from public.transaction_payments where transaction_id = v_seed_tx_id;
    perform public._rls_test_add_result('admin_delete_transaction_payment', true, true, null);
  exception when others then
    perform public._rls_test_add_result('admin_delete_transaction_payment', true, false, sqlerrm);
  end;

  begin
    insert into public.audit_logs (
      id, entity_name, entity_id, action, old_data, new_data, reason, created_by, created_at
    ) values (
      gen_random_uuid(), 'transactions', coalesce(v_seed_tx_id, gen_random_uuid()),
      'RLS_TEST_ADMIN', null, jsonb_build_object('ok', true), 'admin test', admin_uid, now()
    );
    perform public._rls_test_add_result('admin_insert_audit_log', true, true, null);
  exception when others then
    perform public._rls_test_add_result('admin_insert_audit_log', true, false, sqlerrm);
  end;

  reset role;

  -- Limpieza de datos de prueba creados por este script
  delete from public.audit_logs where action in ('RLS_TEST_CASHIER', 'RLS_TEST_ADMIN');
  if v_seed_tx_id is not null then
    delete from public.transaction_payments where transaction_id = v_seed_tx_id;
    delete from public.transactions where id = v_seed_tx_id;
  end if;
  if v_tx_id is not null then
    delete from public.transaction_payments where transaction_id = v_tx_id;
    delete from public.transactions where id = v_tx_id;
  end if;
end
$$;

select
  test_name,
  expected_ok,
  ok,
  case
    when expected_ok = true and ok = true then 'PASS'
    when expected_ok = false and ok = false then 'PASS'
    else 'FAIL'
  end as result,
  error_text
from pg_temp.rls_test_results
order by test_name;

rollback;

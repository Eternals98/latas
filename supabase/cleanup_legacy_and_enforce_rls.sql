-- Ejecutar en Supabase SQL Editor (rol postgres)
-- Objetivo:
-- 1) eliminar tablas legacy que no deben existir
-- 2) asegurar RLS activado en tablas del nuevo modelo

begin;

-- Legacy (v1) que no debe seguir en el esquema
drop table if exists public.pago cascade;
drop table if exists public.venta cascade;
drop table if exists public.medio_pago cascade;
drop table if exists public.cliente cascade;
drop table if exists public.admin_user cascade;

-- Asegurar RLS en tablas vigentes (fase 2+)
alter table if exists public.profiles enable row level security;
alter table if exists public.companies enable row level security;
alter table if exists public.customers enable row level security;
alter table if exists public.payment_methods enable row level security;
alter table if exists public.cash_sessions enable row level security;
alter table if exists public.transactions enable row level security;
alter table if exists public.transaction_payments enable row level security;
alter table if exists public.cash_movements enable row level security;
alter table if exists public.audit_logs enable row level security;

alter table if exists public.profiles force row level security;
alter table if exists public.companies force row level security;
alter table if exists public.customers force row level security;
alter table if exists public.payment_methods force row level security;
alter table if exists public.cash_sessions force row level security;
alter table if exists public.transactions force row level security;
alter table if exists public.transaction_payments force row level security;
alter table if exists public.cash_movements force row level security;
alter table if exists public.audit_logs force row level security;

commit;

-- Verificación rápida
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'companies',
    'customers',
    'payment_methods',
    'cash_sessions',
    'transactions',
    'transaction_payments',
    'cash_movements',
    'audit_logs'
  )
order by tablename;

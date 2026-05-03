insert into public.companies(name)
values ('Latas S.A.S'), ('Tomas Gomez'), ('Generico')
on conflict (name) do nothing;

insert into public.customers(name, phone, normalized_phone, is_generic, is_active)
values ('Cliente Genérico', '0000000000', '0000000000', true, true)
on conflict do nothing;

insert into public.payment_methods(name, code, affects_cash, is_active)
values
  ('EFECTIVO', 'CASH', true, true),
  ('ENTREGA', 'ENTREGA', true, true),
  ('TARJETA LATAS', 'TARJETA_LATAS', false, true),
  ('TARJETA TOMAS', 'TARJETA_TOMAS', false, true),
  ('BANCOLOMBIA LATAS', 'BANCOLOMBIA_LATAS', false, true),
  ('BANCOLOMBIA TOMAS', 'BANCOLOMBIA_TOMAS', false, true),
  ('BBVA LATAS', 'BBVA_LATAS', false, true),
  ('BBVA TOMAS', 'BBVA_TOMAS', false, true),
  ('GIRO', 'GIRO', false, true),
  ('DAVIVIENDA', 'DAVIVIENDA', false, true),
  ('NEQUI TG', 'NEQUI_TG', false, true)
on conflict (code) do nothing;

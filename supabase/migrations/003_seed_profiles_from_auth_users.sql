-- Seed/update public.profiles from auth.users
-- Keep this admin email permanently in admin role and add more emails to the array when needed.

begin;

do $$
declare
  admin_emails text[] := array[
    'gomezjavierbr@gmail.com'
  ];
begin
  insert into public.profiles (id, full_name, role, is_active, created_at)
  select
    u.id,
    coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      u.email,
      'Usuario'
    ) as full_name,
    case
      when lower(u.email) = any (select lower(e) from unnest(admin_emails) as e) then 'admin'
      else 'cashier'
    end as role,
    true as is_active,
    coalesce(u.created_at, now()) as created_at
  from auth.users u
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    role = excluded.role,
    is_active = excluded.is_active,
    created_at = excluded.created_at;
end
$$;

commit;

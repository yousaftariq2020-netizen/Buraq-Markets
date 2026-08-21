-- Buraq Markets — Fix v2: restore client_id generation + keep phone/country/full_name sync
-- Run this in Supabase SQL Editor

-- 1) Recreate the trigger function WITH client_id generation restored
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_client_id text;
begin
  -- Generate a client id like BM-XXXXXXXX (8 uppercase hex chars)
  new_client_id := 'BM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.profiles (id, full_name, phone, country, role, kyc_status, client_id, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'country', ''),
    'client',
    'Pending',
    new_client_id,
    now()
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
        phone     = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
        country   = coalesce(nullif(excluded.country, ''), public.profiles.country),
        client_id = coalesce(public.profiles.client_id, excluded.client_id);
  return new;
end;
$$;

-- 2) Re-attach the trigger (safe even if it already exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3) Backfill: give a client_id to any existing profile that's missing one (e.g. TAHQ),
--    but never touch rows that already have one (like Madiha, Mehreen, Muhammad, or admin)
update public.profiles
set client_id = 'BM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where client_id is null or client_id = '';

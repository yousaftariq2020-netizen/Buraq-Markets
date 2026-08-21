-- Buraq Markets — Fix: store client email in profiles table
-- Needed so the admin dashboard can send notification emails to clients
-- Run this in Supabase SQL Editor

-- 1) Add email column if it doesn't exist
alter table public.profiles
  add column if not exists email text;

-- 2) Update the signup trigger to also store the user's email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_client_id text;
begin
  new_client_id := 'BM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.profiles (id, full_name, phone, country, role, kyc_status, client_id, email, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'country', ''),
    'client',
    'Pending',
    new_client_id,
    new.email,
    now()
  )
  on conflict (id) do update
    set full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
        phone     = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
        country   = coalesce(nullif(excluded.country, ''), public.profiles.country),
        client_id = coalesce(public.profiles.client_id, excluded.client_id),
        email     = coalesce(nullif(public.profiles.email, ''), excluded.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3) Backfill email for existing profiles (Yousaf, Madiha, Mehreen, Muhammad, TAHQ, etc.)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and (p.email is null or p.email = '');

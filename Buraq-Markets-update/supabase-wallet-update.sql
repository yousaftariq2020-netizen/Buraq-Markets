-- Buraq Markets — Wallet-first account model
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- Change:
-- 1) New signups now get ONE "Wallet" type trading account automatically
--    (not Standard / ECN / VIP).
-- 2) Clients can only open a Standard / ECN / VIP account themselves AFTER
--    their KYC is Verified (enforced in the app UI + can be re-checked by
--    admin in Supabase, since profiles.kyc_status is the source of truth).
-- 3) All deposits go into the Wallet account. Clients move funds from the
--    Wallet into a Standard/ECN/VIP account using Internal Transfer.

-- Add a flag so the app can reliably find "the" wallet account for a user.
alter table public.trading_accounts
  add column if not exists is_wallet boolean not null default false;

-- Backfill: for any user who already has accounts, mark their oldest
-- account as the Wallet (best-effort migration for existing clients).
update public.trading_accounts t
set is_wallet = true
where t.id = (
  select min(t2.id) from public.trading_accounts t2 where t2.user_id = t.user_id
)
and not exists (
  select 1 from public.trading_accounts t3
  where t3.user_id = t.user_id and t3.is_wallet = true
);

-- Replace the signup trigger so it always creates a single Wallet account
-- (ignores account_type chosen at signup, since that field is no longer
-- used to determine the first account).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, country, account_type, preferred_platform, client_id)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'account_type',
    new.raw_user_meta_data->>'preferred_platform',
    'BM-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
  )
  on conflict (id) do nothing;

  insert into public.trading_accounts (user_id, account_number, account_name, platform, is_wallet)
  values (new.id, 'BM-' || floor(100000 + random() * 899999)::text, 'Wallet', 'Wallet', true)
  on conflict (account_number) do nothing;

  return new;
end;
$$;

-- Only allow a client to insert Standard/ECN/VIP accounts for themselves
-- when their KYC is already Verified. (The insert policy from
-- supabase-new-account-policy.sql must already be applied; this replaces
-- it with a stricter version.)
drop policy if exists "accounts_insert_own" on public.trading_accounts;
create policy "accounts_insert_own"
on public.trading_accounts
for insert
with check (
  auth.uid() = user_id
  and is_wallet = false
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.kyc_status = 'Verified'
  )
);

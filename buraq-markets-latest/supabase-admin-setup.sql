-- Buraq Markets — Admin Panel Setup
-- Run once in Supabase SQL Editor

-- 1) Add role column to profiles
alter table public.profiles
  add column if not exists role text not null default 'client';

-- 2) Mark your admin account (CHANGE THE EMAIL to your admin email)
-- Example:
-- update public.profiles set role = 'admin' where id = (
--   select id from auth.users where email = 'your-admin@email.com'
-- );

-- 3) Allow admins to read ALL profiles
drop policy if exists "profiles_admin_select" on public.profiles;
create policy "profiles_admin_select"
on public.profiles for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 4) Allow admins to update any profile (for KYC status etc.)
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update"
on public.profiles for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 5) Allow admins to read ALL trading accounts
drop policy if exists "accounts_admin_select" on public.trading_accounts;
create policy "accounts_admin_select"
on public.trading_accounts for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 6) Allow admins to update trading accounts (balance etc.)
drop policy if exists "accounts_admin_update" on public.trading_accounts;
create policy "accounts_admin_update"
on public.trading_accounts for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 7) Allow admins to read ALL transactions
drop policy if exists "transactions_admin_select" on public.transactions;
create policy "transactions_admin_select"
on public.transactions for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 8) Allow admins to update transactions (approve/reject)
drop policy if exists "transactions_admin_update" on public.transactions;
create policy "transactions_admin_update"
on public.transactions for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 9) Allow admins to read ALL kyc documents
drop policy if exists "kyc_admin_select" on public.kyc_documents;
create policy "kyc_admin_select"
on public.kyc_documents for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 10) Allow admins to update kyc documents
drop policy if exists "kyc_admin_update" on public.kyc_documents;
create policy "kyc_admin_update"
on public.kyc_documents for update
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 11) Allow admins to read contact messages
drop policy if exists "contact_admin_select" on public.contact_messages;
create policy "contact_admin_select"
on public.contact_messages for select
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

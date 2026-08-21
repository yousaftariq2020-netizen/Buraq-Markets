-- Buraq Markets — Deposit Slip Upload + Admin Document Viewing
-- Run once in Supabase SQL Editor (after supabase-admin-setup.sql)

-- 1) Add a column to store the deposit slip / payment screenshot path
alter table public.transactions
  add column if not exists slip_path text;

-- 2) Storage bucket "deposit-proofs" already exists (created manually).
--    Skipping bucket creation — just adding the policies below.

-- 3) Allow logged-in users to upload their OWN deposit slip
drop policy if exists "slips_user_insert" on storage.objects;
create policy "slips_user_insert"
on storage.objects for insert
with check (
  bucket_id = 'deposit-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) Allow users to view their OWN uploaded slip
drop policy if exists "slips_user_select" on storage.objects;
create policy "slips_user_select"
on storage.objects for select
using (
  bucket_id = 'deposit-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 5) Allow ADMINS to view every deposit slip (any user's)
drop policy if exists "slips_admin_select" on storage.objects;
create policy "slips_admin_select"
on storage.objects for select
using (
  bucket_id = 'deposit-proofs'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 6) Allow ADMINS to view every KYC document (id doc + selfie) — needed
--    because supabase-admin-setup.sql only gave admins table access,
--    not storage file access.
drop policy if exists "kyc_admin_storage_select" on storage.objects;
create policy "kyc_admin_storage_select"
on storage.objects for select
using (
  bucket_id = 'kyc-documents'
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

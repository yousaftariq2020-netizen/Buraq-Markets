
-- Add this policy after the original schema has been run.
-- It allows logged-in users to create deposit/transaction requests only for themselves.
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
on public.transactions
for insert
with check (auth.uid() = user_id);

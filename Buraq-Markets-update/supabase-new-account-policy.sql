-- Buraq Markets — secure client-side account creation metadata
-- Run after the base trading_accounts table exists.

alter table public.trading_accounts add column if not exists account_type text;
alter table public.trading_accounts add column if not exists account_mode text;
alter table public.trading_accounts add column if not exists currency text default 'USD';

-- Restrict values accepted from the client. Actual MT5 credentials are intentionally
-- NOT stored in this client-writable table. They must come from your broker/MT5
-- provisioning backend.
alter table public.trading_accounts drop constraint if exists trading_accounts_account_mode_check;
alter table public.trading_accounts add constraint trading_accounts_account_mode_check
check (account_mode is null or account_mode in ('Demo','Live'));

alter table public.trading_accounts drop constraint if exists trading_accounts_account_type_check;
alter table public.trading_accounts add constraint trading_accounts_account_type_check
check (account_type is null or account_type in ('Standard','ECN','VIP'));

alter table public.trading_accounts drop constraint if exists trading_accounts_currency_check;
alter table public.trading_accounts add constraint trading_accounts_currency_check
check (currency is null or currency in ('USD'));

drop policy if exists "accounts_insert_own" on public.trading_accounts;
create policy "accounts_insert_own"
on public.trading_accounts
for insert
with check (auth.uid() = user_id);

-- IMPORTANT: do not add an UPDATE policy for clients.
-- Do not add mt5_password or other secrets to this table.

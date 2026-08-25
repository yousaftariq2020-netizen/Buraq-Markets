-- Buraq Markets — Rename existing wallet account
-- Run this once in Supabase SQL Editor, AFTER supabase-wallet-update.sql.
--
-- supabase-wallet-update.sql marked each user's oldest account as the
-- wallet (is_wallet = true) but did not rename it. This renames it to
-- "Wallet" so it's clearly visible on the dashboard and in Internal
-- Transfer dropdowns.

update public.trading_accounts
set account_name = 'Wallet'
where is_wallet = true and account_name <> 'Wallet';

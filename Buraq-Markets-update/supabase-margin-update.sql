-- Buraq Markets — Free Margin live calculation update
-- Run this once in Supabase Dashboard > SQL Editor (safe to run even if already applied).

-- 1) Add a used_margin column so Free Margin can be calculated as Equity - Used Margin
alter table public.trading_accounts
  add column if not exists used_margin numeric(18,2) not null default 0;

-- 2) Backfill: if you already have accounts with a stored free_margin,
--    derive used_margin from it once (equity - free_margin = used_margin).
--    Safe to skip if all accounts are new / at 0.
update public.trading_accounts
set used_margin = greatest(coalesce(equity,0) - coalesce(free_margin,0), 0)
where used_margin = 0;

-- Note: free_margin column is kept for backward compatibility, but the
-- dashboard now calculates it live in the browser as:
--   free_margin = equity - used_margin
-- Your backend/admin process should keep `equity` and `used_margin` accurate;
-- it no longer needs to write to `free_margin` directly.

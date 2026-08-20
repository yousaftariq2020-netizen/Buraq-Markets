-- Buraq Markets — Fix: reset used_margin for accounts with no open trades
-- The earlier backfill mistakenly set used_margin = equity for accounts
-- that had free_margin = 0 (the old default), even though those accounts
-- have no open positions. Run this once in Supabase SQL Editor.

update public.trading_accounts
set used_margin = 0
where used_margin = equity;

-- After this, Free Margin (Equity - Used Margin) will correctly show
-- the full equity as available margin for accounts with no open trades.
--
-- Going forward: used_margin should only be set to a non-zero value
-- by your admin/backend process when a client actually opens a trade
-- that locks margin. It should never auto-equal equity.

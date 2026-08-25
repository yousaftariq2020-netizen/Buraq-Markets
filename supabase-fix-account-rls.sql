-- ==============================================================================
-- BURAQ MARKETS — FIX MT5 ACCOUNT CREATION ROW LEVEL SECURITY (RLS) & RPC
-- ==============================================================================
-- Instructions: Copy and run this in your Supabase Project > SQL Editor.
-- This immediately fixes the error: "new row violates row-level security policy for table 'trading_accounts'"

-- 1. Ensure all columns exist on trading_accounts
alter table public.trading_accounts add column if not exists is_wallet boolean not null default false;
alter table public.trading_accounts add column if not exists account_type text;
alter table public.trading_accounts add column if not exists account_mode text;
alter table public.trading_accounts add column if not exists currency text default 'USD';
alter table public.trading_accounts add column if not exists leverage text default '1:500';
alter table public.trading_accounts add column if not exists status text default 'ACTIVE';
alter table public.trading_accounts add column if not exists balance numeric default 0;
alter table public.trading_accounts add column if not exists equity numeric default 0;
alter table public.trading_accounts add column if not exists free_margin numeric default 0;
alter table public.trading_accounts add column if not exists today_pl numeric default 0;
alter table public.trading_accounts add column if not exists margin_level numeric default 0;

-- 2. Drop any old/conflicting RLS policies on trading_accounts
drop policy if exists "accounts_select_own" on public.trading_accounts;
create policy "accounts_select_own" on public.trading_accounts
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "accounts_insert_own" on public.trading_accounts;
create policy "accounts_insert_own" on public.trading_accounts
  for insert to authenticated
  with check (auth.uid() = user_id);

-- 3. Security Definer RPC Function: create_trading_account
-- This creates MT5 trading accounts directly on behalf of authenticated users safely
create or replace function public.create_trading_account(
  p_account_name text,
  p_platform text default 'MT5',
  p_leverage text default '1:500',
  p_account_type text default 'Standard',
  p_account_mode text default 'Live',
  p_currency text default 'USD',
  p_initial_balance numeric default 0
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_account_number text;
  v_account record;
  v_prefix text;
  v_balance numeric;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated. Please log in first.';
  end if;

  if p_account_mode = 'Demo' then
    v_prefix := '88';
    v_balance := coalesce(p_initial_balance, 10000.00);
  else
    v_prefix := '55';
    v_balance := 0.00;
  end if;

  v_account_number := v_prefix || floor(1000 + random() * 8999)::text;

  insert into public.trading_accounts (
    user_id,
    account_number,
    account_name,
    platform,
    leverage,
    balance,
    equity,
    free_margin,
    today_pl,
    margin_level,
    status,
    is_wallet,
    account_type,
    account_mode,
    currency
  ) values (
    v_user_id,
    v_account_number,
    p_account_name,
    coalesce(p_platform, 'MT5'),
    coalesce(p_leverage, '1:500'),
    v_balance,
    v_balance,
    v_balance,
    0,
    0,
    'ACTIVE',
    false,
    coalesce(p_account_type, 'Standard'),
    coalesce(p_account_mode, 'Live'),
    coalesce(p_currency, 'USD')
  )
  returning * into v_account;

  return row_to_json(v_account);
end;
$$;

grant execute on function public.create_trading_account to authenticated;

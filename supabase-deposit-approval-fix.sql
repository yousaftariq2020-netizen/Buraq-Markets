-- ==========================================================
-- BURAQ MARKETS: DEPOSIT APPROVAL & BALANCE SYNC FIX
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ==========================================================

-- 1. Ensure columns exist on trading_accounts
alter table public.trading_accounts add column if not exists is_wallet boolean not null default false;
alter table public.trading_accounts add column if not exists balance numeric default 0;
alter table public.trading_accounts add column if not exists equity numeric default 0;
alter table public.trading_accounts add column if not exists free_margin numeric default 0;
alter table public.trading_accounts add column if not exists used_margin numeric default 0;

-- 2. Drop restrictive policies and allow Admin full access to trading_accounts and transactions
drop policy if exists "accounts_admin_all" on public.trading_accounts;
create policy "accounts_admin_all" on public.trading_accounts
for all using (
  auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "transactions_admin_all" on public.transactions;
create policy "transactions_admin_all" on public.transactions
for all using (
  auth.uid() = user_id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  )
);

-- 3. Stored Procedure: approve_deposit (SECURITY DEFINER bypasses RLS)
create or replace function public.approve_deposit(p_transaction_id bigint)
returns json
language plpgsql
security definer
as $$
declare
  v_tx record;
  v_acc record;
  v_deposit_amt numeric;
  v_new_bal numeric;
  v_acc_id bigint;
begin
  -- Fetch transaction
  select * into v_tx from public.transactions where id = p_transaction_id;
  
  if not found then
    return json_build_object('success', false, 'message', 'Transaction not found');
  end if;

  v_deposit_amt := abs(coalesce(v_tx.amount, 0));

  -- If already approved and processed, prevent double credit
  if lower(coalesce(v_tx.status, '')) = 'approved' then
    -- If already approved, still verify account exists
    return json_build_object('success', true, 'message', 'Transaction was already approved');
  end if;

  -- Update transaction status to Approved
  update public.transactions
  set status = 'Approved'
  where id = p_transaction_id;

  -- Find client's trading account or wallet
  v_acc_id := v_tx.trading_account_id;
  
  if v_acc_id is not null then
    select * into v_acc from public.trading_accounts where id = v_acc_id;
  end if;

  -- If not found by ID, look for user's wallet or first account
  if v_acc is null and v_tx.user_id is not null then
    select * into v_acc from public.trading_accounts 
    where user_id = v_tx.user_id 
    order by is_wallet desc, created_at asc 
    limit 1;
  end if;

  -- If user has no account at all, create a default Main Wallet
  if v_acc is null and v_tx.user_id is not null then
    insert into public.trading_accounts (
      user_id, account_number, account_name, platform, is_wallet, currency, balance, equity, free_margin
    ) values (
      v_tx.user_id,
      'BM' || floor(100000 + random()*900000)::text,
      'Main Wallet',
      'Buraq Wallet',
      true,
      'USD',
      v_deposit_amt,
      v_deposit_amt,
      v_deposit_amt
    ) returning * into v_acc;

    -- Link this newly created account to the transaction
    update public.transactions set trading_account_id = v_acc.id where id = p_transaction_id;

    return json_build_object(
      'success', true,
      'message', 'Deposit approved and new Main Wallet created with balance credited',
      'account_id', v_acc.id,
      'new_balance', v_deposit_amt
    );
  end if;

  -- If account exists, add deposit amount to balance, equity, free margin
  if v_acc is not null then
    v_new_bal := coalesce(v_acc.balance, 0) + v_deposit_amt;

    update public.trading_accounts
    set 
      balance = v_new_bal,
      equity = coalesce(equity, balance, 0) + v_deposit_amt,
      free_margin = coalesce(free_margin, balance, 0) + v_deposit_amt
    where id = v_acc.id;

    -- Ensure transaction has trading_account_id attached
    if v_tx.trading_account_id is null then
      update public.transactions set trading_account_id = v_acc.id where id = p_transaction_id;
    end if;

    return json_build_object(
      'success', true,
      'message', 'Deposit approved and balance credited successfully',
      'account_id', v_acc.id,
      'new_balance', v_new_bal
    );
  end if;

  return json_build_object('success', true, 'message', 'Transaction status marked as Approved');
end;
$$;

-- 4. Stored Procedure: process_withdrawal_request (Client requests withdrawal -> immediately hold/deduct funds)
create or replace function public.process_withdrawal_request(
  p_user_id uuid,
  p_account_id bigint,
  p_amount numeric,
  p_type text,
  p_reference text
)
returns json
language plpgsql
security definer
as $$
declare
  v_acc record;
  v_amt numeric;
  v_new_bal numeric;
  v_tx_id bigint;
begin
  v_amt := abs(coalesce(p_amount, 0));
  if v_amt <= 0 then
    return json_build_object('success', false, 'message', 'Invalid withdrawal amount');
  end if;

  select * into v_acc from public.trading_accounts where id = p_account_id and user_id = p_user_id;
  if not found then
    return json_build_object('success', false, 'message', 'Trading account not found');
  end if;

  if coalesce(v_acc.balance, 0) < v_amt then
    return json_build_object('success', false, 'message', 'Insufficient funds');
  end if;

  -- Immediately deduct held balance from account
  v_new_bal := v_acc.balance - v_amt;
  update public.trading_accounts
  set 
    balance = v_new_bal,
    equity = greatest(0, coalesce(equity, balance) - v_amt),
    free_margin = greatest(0, coalesce(free_margin, balance) - v_amt)
  where id = p_account_id;

  -- Create pending withdrawal record
  insert into public.transactions (
    user_id,
    trading_account_id,
    type,
    reference,
    amount,
    status
  ) values (
    p_user_id,
    p_account_id,
    coalesce(p_type, 'Withdrawal'),
    p_reference,
    -v_amt,
    'Pending'
  ) returning id into v_tx_id;

  return json_build_object(
    'success', true,
    'message', 'Withdrawal request submitted and balance deducted',
    'transaction_id', v_tx_id,
    'new_balance', v_new_bal
  );
end;
$$;

-- 5. Stored Procedure: decline_withdrawal (Admin declines -> immediately refund held balance back to account)
create or replace function public.decline_withdrawal(p_transaction_id bigint)
returns json
language plpgsql
security definer
as $$
declare
  v_tx record;
  v_acc record;
  v_amt numeric;
  v_new_bal numeric;
begin
  select * into v_tx from public.transactions where id = p_transaction_id;
  if not found then
    return json_build_object('success', false, 'message', 'Transaction not found');
  end if;

  if lower(coalesce(v_tx.status, '')) = 'declined' then
    return json_build_object('success', true, 'message', 'Already declined');
  end if;

  v_amt := abs(coalesce(v_tx.amount, 0));

  update public.transactions set status = 'Declined' where id = p_transaction_id;

  -- Refund amount back to trading account / wallet
  if v_tx.trading_account_id is not null then
    select * into v_acc from public.trading_accounts where id = v_tx.trading_account_id;
  end if;

  if v_acc is null and v_tx.user_id is not null then
    select * into v_acc from public.trading_accounts where user_id = v_tx.user_id order by is_wallet desc limit 1;
  end if;

  if v_acc is not null then
    v_new_bal := coalesce(v_acc.balance, 0) + v_amt;
    update public.trading_accounts
    set 
      balance = v_new_bal,
      equity = coalesce(equity, balance, 0) + v_amt,
      free_margin = coalesce(free_margin, balance, 0) + v_amt
    where id = v_acc.id;

    return json_build_object('success', true, 'message', 'Withdrawal declined and balance refunded', 'new_balance', v_new_bal);
  end if;

  return json_build_object('success', true, 'message', 'Withdrawal declined');
end;
$$;

-- 5. Stored Procedure: admin_set_account_balance (Direct Balance Adjustment)
create or replace function public.admin_set_account_balance(p_account_id bigint, p_new_balance numeric)
returns json
language plpgsql
security definer
as $$
begin
  update public.trading_accounts
  set 
    balance = p_new_balance,
    equity = p_new_balance,
    free_margin = p_new_balance
  where id = p_account_id;

  return json_build_object('success', true, 'new_balance', p_new_balance);
end;
$$;

-- 6. Helper Procedure: sync_all_approved_deposits
-- Backfill any previously approved deposit where the client's balance was not credited!
create or replace function public.sync_all_approved_deposits()
returns json
language plpgsql
security definer
as $$
declare
  t record;
  v_acc record;
  v_count int := 0;
begin
  for t in 
    select * from public.transactions 
    where lower(coalesce(type, '')) like '%deposit%'
      and lower(coalesce(status, '')) in ('approved', 'completed')
  loop
    -- Find account
    select * into v_acc from public.trading_accounts where id = t.trading_account_id;
    if v_acc is null and t.user_id is not null then
      select * into v_acc from public.trading_accounts where user_id = t.user_id order by is_wallet desc limit 1;
    end if;

    if v_acc is null and t.user_id is not null then
      insert into public.trading_accounts (
        user_id, account_number, account_name, platform, is_wallet, currency, balance, equity, free_margin
      ) values (
        t.user_id,
        'BM' || floor(100000 + random()*900000)::text,
        'Main Wallet',
        'Buraq Wallet',
        true,
        'USD',
        abs(t.amount),
        abs(t.amount),
        abs(t.amount)
      ) returning * into v_acc;
      v_count := v_count + 1;
    end if;
  end loop;

  return json_build_object('success', true, 'synced_count', v_count);
end;
$$;

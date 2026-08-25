-- Buraq Markets — Instant Internal Transfer (no admin approval)
-- Run this once in Supabase Dashboard > SQL Editor.
--
-- Internal transfers between a client's OWN accounts now happen instantly:
-- balances update immediately and the transaction rows are logged as
-- "Approved" right away (unlike Deposit/Withdraw, which still stay
-- Pending for manual admin review).
--
-- This is done through a security-definer function instead of a public
-- UPDATE policy on trading_accounts, so a client can never update any
-- account balance directly — only through this controlled, atomic,
-- ownership-checked function.

create or replace function public.internal_transfer(
  p_from_account bigint,
  p_to_account bigint,
  p_amount numeric,
  p_note text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_from public.trading_accounts;
  v_to public.trading_accounts;
  v_free numeric;
  v_ref text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Invalid amount';
  end if;

  if p_from_account = p_to_account then
    raise exception 'From and To accounts must be different';
  end if;

  select * into v_from from public.trading_accounts
    where id = p_from_account and user_id = v_user for update;
  if not found then
    raise exception 'Source account not found';
  end if;

  select * into v_to from public.trading_accounts
    where id = p_to_account and user_id = v_user for update;
  if not found then
    raise exception 'Destination account not found';
  end if;

  v_free := coalesce(v_from.equity,0) - coalesce(v_from.used_margin,0);
  if p_amount > v_free then
    raise exception 'Amount exceeds available Free Margin ($%)', trim(to_char(v_free,'FM999999999.00'));
  end if;

  update public.trading_accounts
    set balance = balance - p_amount, equity = equity - p_amount
    where id = v_from.id;

  update public.trading_accounts
    set balance = balance + p_amount, equity = equity + p_amount
    where id = v_to.id;

  v_ref := 'TRF-' || to_char(now(), 'YYMMDDHH24MISS') || floor(random()*900+100)::text;

  insert into public.transactions (user_id, trading_account_id, type, reference, amount, status)
  values (
    v_user, v_from.id,
    'Transfer Out - to ' || v_to.account_name || ' #' || v_to.account_number || coalesce(' — ' || p_note, ''),
    v_ref || '-OUT', -p_amount, 'Approved'
  );

  insert into public.transactions (user_id, trading_account_id, type, reference, amount, status)
  values (
    v_user, v_to.id,
    'Transfer In - from ' || v_from.account_name || ' #' || v_from.account_number || coalesce(' — ' || p_note, ''),
    v_ref || '-IN', p_amount, 'Approved'
  );
end;
$$;

grant execute on function public.internal_transfer(bigint, bigint, numeric, text) to authenticated;

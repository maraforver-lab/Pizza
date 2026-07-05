create or replace function public.get_public_party_order(token_value text)
returns table (
  public_token text,
  title text,
  pizza_datetime timestamptz,
  orders_close_at timestamptz,
  guest_note text,
  allowed_pizza_ids text[],
  status text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    party_orders.public_token,
    party_orders.title,
    party_orders.pizza_datetime,
    party_orders.orders_close_at,
    party_orders.guest_note,
    party_orders.allowed_pizza_ids,
    party_orders.status,
    party_orders.updated_at
  from public.party_orders
  where party_orders.public_token = token_value
  limit 1;
$$;

revoke all on function public.get_public_party_order(text) from public;
grant execute on function public.get_public_party_order(text) to anon, authenticated;

alter table public.party_orders
  add column if not exists time_zone text;

update public.party_orders
set time_zone = 'Europe/Helsinki'
where time_zone is null
  or trim(time_zone) = '';

alter table public.party_orders
  alter column time_zone set default 'Europe/Helsinki',
  alter column time_zone set not null;

alter table public.party_orders
  drop constraint if exists party_orders_time_zone_check;

alter table public.party_orders
  add constraint party_orders_time_zone_check
  check (
    char_length(trim(time_zone)) >= 3
    and time_zone !~ '[[:space:]]'
  );

drop function if exists public.get_public_party_order(text);

create or replace function public.get_public_party_order(token_value text)
returns table (
  public_token text,
  title text,
  pizza_datetime timestamptz,
  orders_close_at timestamptz,
  time_zone text,
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
    party_orders.time_zone,
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

drop function if exists public.get_public_party_order_submission(text, text);

create or replace function public.get_public_party_order_submission(
  token_value text,
  edit_token_value text
)
returns table (
  public_token text,
  title text,
  pizza_datetime timestamptz,
  orders_close_at timestamptz,
  time_zone text,
  guest_note text,
  allowed_pizza_ids text[],
  status text,
  updated_at timestamptz,
  submission_id uuid,
  guest_name text,
  guest_comment text,
  submission_updated_at timestamptz,
  items jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    party_orders.public_token,
    party_orders.title,
    party_orders.pizza_datetime,
    party_orders.orders_close_at,
    party_orders.time_zone,
    party_orders.guest_note,
    party_orders.allowed_pizza_ids,
    party_orders.status,
    party_orders.updated_at,
    party_order_submissions.id as submission_id,
    party_order_submissions.guest_name,
    party_order_submissions.guest_comment,
    party_order_submissions.updated_at as submission_updated_at,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'pizza_id', party_order_items.pizza_id,
          'pizza_name_snapshot', party_order_items.pizza_name_snapshot,
          'quantity', party_order_items.quantity
        )
        order by party_order_items.created_at
      ) filter (where party_order_items.id is not null),
      '[]'::jsonb
    ) as items
  from public.party_orders
  join public.party_order_submissions
    on party_order_submissions.party_order_id = party_orders.id
  left join public.party_order_items
    on party_order_items.submission_id = party_order_submissions.id
  where party_orders.public_token = token_value
    and party_order_submissions.edit_token = edit_token_value
  group by party_orders.id, party_order_submissions.id
  limit 1;
$$;

revoke all on function public.get_public_party_order_submission(text, text) from public;
grant execute on function public.get_public_party_order_submission(text, text) to anon, authenticated;

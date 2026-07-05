create table if not exists public.party_order_submissions (
  id uuid primary key default gen_random_uuid(),
  party_order_id uuid not null references public.party_orders(id) on delete cascade,
  guest_name text not null,
  guest_comment text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint party_order_submissions_guest_name_check check (char_length(trim(guest_name)) between 1 and 80),
  constraint party_order_submissions_guest_comment_check check (guest_comment is null or char_length(guest_comment) <= 500)
);

create table if not exists public.party_order_items (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.party_order_submissions(id) on delete cascade,
  pizza_id text not null,
  pizza_name_snapshot text not null,
  quantity integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint party_order_items_quantity_check check (quantity between 1 and 10),
  constraint party_order_items_pizza_id_check check (char_length(trim(pizza_id)) > 0),
  constraint party_order_items_pizza_name_snapshot_check check (char_length(trim(pizza_name_snapshot)) > 0)
);

create index if not exists party_order_submissions_party_order_created_idx
  on public.party_order_submissions (party_order_id, created_at desc);

create index if not exists party_order_items_submission_idx
  on public.party_order_items (submission_id);

create index if not exists party_order_items_pizza_id_idx
  on public.party_order_items (pizza_id);

alter table public.party_order_submissions enable row level security;
alter table public.party_order_items enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on public.party_order_submissions to anon, authenticated;
grant select, insert on public.party_order_items to anon, authenticated;

drop policy if exists "Owners can read their party order submissions" on public.party_order_submissions;
create policy "Owners can read their party order submissions"
  on public.party_order_submissions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.party_orders
      where party_orders.id = party_order_submissions.party_order_id
        and party_orders.user_id = auth.uid()
    )
  );

drop policy if exists "Owners can read their party order items" on public.party_order_items;
create policy "Owners can read their party order items"
  on public.party_order_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.party_order_submissions
      join public.party_orders on party_orders.id = party_order_submissions.party_order_id
      where party_order_submissions.id = party_order_items.submission_id
        and party_orders.user_id = auth.uid()
    )
  );

create or replace function public.submit_public_party_order(
  token_value text,
  guest_name_value text,
  guest_comment_value text,
  items_value jsonb
)
returns table (
  submission_id uuid,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_party_order_id uuid;
  allowed_ids text[];
  trimmed_guest_name text := trim(coalesce(guest_name_value, ''));
  trimmed_guest_comment text := nullif(trim(coalesce(guest_comment_value, '')), '');
  item_count integer;
  total_quantity integer;
  next_submission_id uuid;
  next_created_at timestamptz;
begin
  select party_orders.id, party_orders.allowed_pizza_ids
    into target_party_order_id, allowed_ids
  from public.party_orders
  where party_orders.public_token = token_value
    and party_orders.status = 'open'
    and party_orders.orders_close_at >= timezone('utc', now())
  limit 1;

  if target_party_order_id is null then
    raise exception 'party_order_closed_or_missing';
  end if;

  if char_length(trimmed_guest_name) < 1 or char_length(trimmed_guest_name) > 80 then
    raise exception 'invalid_guest_name';
  end if;

  if trimmed_guest_comment is not null and char_length(trimmed_guest_comment) > 500 then
    raise exception 'invalid_guest_comment';
  end if;

  if jsonb_typeof(items_value) <> 'array' then
    raise exception 'invalid_items';
  end if;

  select count(*), coalesce(sum(quantity), 0)
    into item_count, total_quantity
  from jsonb_to_recordset(items_value) as item(pizza_id text, pizza_name_snapshot text, quantity integer);

  if item_count < 1 or total_quantity < 1 or total_quantity > 20 then
    raise exception 'invalid_quantity';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(items_value) as item(pizza_id text, pizza_name_snapshot text, quantity integer)
    where item.pizza_id is null
      or item.pizza_name_snapshot is null
      or trim(item.pizza_id) = ''
      or trim(item.pizza_name_snapshot) = ''
      or item.quantity is null
      or item.quantity < 1
      or item.quantity > 10
      or not (item.pizza_id = any(allowed_ids))
  ) then
    raise exception 'invalid_items';
  end if;

  insert into public.party_order_submissions (
    party_order_id,
    guest_name,
    guest_comment
  )
  values (
    target_party_order_id,
    trimmed_guest_name,
    trimmed_guest_comment
  )
  returning id, party_order_submissions.created_at
  into next_submission_id, next_created_at;

  insert into public.party_order_items (
    submission_id,
    pizza_id,
    pizza_name_snapshot,
    quantity
  )
  select
    next_submission_id,
    item.pizza_id,
    item.pizza_name_snapshot,
    item.quantity
  from jsonb_to_recordset(items_value) as item(pizza_id text, pizza_name_snapshot text, quantity integer);

  return query select next_submission_id, next_created_at;
end;
$$;

revoke all on function public.submit_public_party_order(text, text, text, jsonb) from public;
grant execute on function public.submit_public_party_order(text, text, text, jsonb) to anon, authenticated;

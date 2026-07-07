alter table public.party_order_submissions
  add column if not exists edit_token text;

update public.party_order_submissions
set edit_token = encode(gen_random_bytes(24), 'hex')
where edit_token is null;

alter table public.party_order_submissions
  alter column edit_token set not null;

create unique index if not exists party_order_submissions_edit_token_idx
  on public.party_order_submissions (edit_token);

alter table public.party_order_submissions
  drop constraint if exists party_order_submissions_edit_token_check;

alter table public.party_order_submissions
  add constraint party_order_submissions_edit_token_check check (char_length(trim(edit_token)) >= 32);

drop function if exists public.submit_public_party_order(text, text, text, jsonb);

create or replace function public.submit_public_party_order(
  token_value text,
  guest_name_value text,
  guest_comment_value text,
  items_value jsonb
)
returns table (
  submission_id uuid,
  edit_token text,
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
  next_edit_token text := encode(gen_random_bytes(24), 'hex');
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
    guest_comment,
    edit_token
  )
  values (
    target_party_order_id,
    trimmed_guest_name,
    trimmed_guest_comment,
    next_edit_token
  )
  returning id, party_order_submissions.edit_token, party_order_submissions.created_at
  into next_submission_id, next_edit_token, next_created_at;

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

  return query select next_submission_id, next_edit_token, next_created_at;
end;
$$;

revoke all on function public.submit_public_party_order(text, text, text, jsonb) from public;
grant execute on function public.submit_public_party_order(text, text, text, jsonb) to anon, authenticated;

create or replace function public.get_public_party_order_submission(
  token_value text,
  edit_token_value text
)
returns table (
  public_token text,
  title text,
  pizza_datetime timestamptz,
  orders_close_at timestamptz,
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

create or replace function public.update_public_party_order_submission(
  token_value text,
  edit_token_value text,
  guest_name_value text,
  guest_comment_value text,
  items_value jsonb
)
returns table (
  submission_id uuid,
  edit_token text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_party_order_id uuid;
  target_submission_id uuid;
  allowed_ids text[];
  trimmed_guest_name text := trim(coalesce(guest_name_value, ''));
  trimmed_guest_comment text := nullif(trim(coalesce(guest_comment_value, '')), '');
  item_count integer;
  total_quantity integer;
  next_updated_at timestamptz := timezone('utc', now());
begin
  select party_orders.id, party_order_submissions.id, party_orders.allowed_pizza_ids
    into target_party_order_id, target_submission_id, allowed_ids
  from public.party_orders
  join public.party_order_submissions
    on party_order_submissions.party_order_id = party_orders.id
  where party_orders.public_token = token_value
    and party_order_submissions.edit_token = edit_token_value
    and party_orders.status = 'open'
    and party_orders.orders_close_at >= timezone('utc', now())
  limit 1;

  if target_party_order_id is null or target_submission_id is null then
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

  update public.party_order_submissions
  set
    guest_name = trimmed_guest_name,
    guest_comment = trimmed_guest_comment,
    updated_at = next_updated_at
  where id = target_submission_id;

  delete from public.party_order_items
  where submission_id = target_submission_id;

  insert into public.party_order_items (
    submission_id,
    pizza_id,
    pizza_name_snapshot,
    quantity
  )
  select
    target_submission_id,
    item.pizza_id,
    item.pizza_name_snapshot,
    item.quantity
  from jsonb_to_recordset(items_value) as item(pizza_id text, pizza_name_snapshot text, quantity integer);

  return query select target_submission_id, edit_token_value, next_updated_at;
end;
$$;

revoke all on function public.update_public_party_order_submission(text, text, text, text, jsonb) from public;
grant execute on function public.update_public_party_order_submission(text, text, text, text, jsonb) to anon, authenticated;

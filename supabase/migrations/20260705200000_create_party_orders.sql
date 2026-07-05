create table if not exists public.party_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  public_token text not null unique,
  title text not null,
  pizza_datetime timestamptz not null,
  orders_close_at timestamptz not null,
  guest_note text,
  allowed_pizza_ids text[] not null default '{}',
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint party_orders_status_check check (status in ('open', 'closed')),
  constraint party_orders_allowed_pizzas_check check (cardinality(allowed_pizza_ids) > 0),
  constraint party_orders_close_before_pizza_check check (orders_close_at <= pizza_datetime)
);

create index if not exists party_orders_user_updated_idx
  on public.party_orders (user_id, updated_at desc);

create index if not exists party_orders_public_token_idx
  on public.party_orders (public_token);

alter table public.party_orders enable row level security;

drop policy if exists "Users can read their own party orders" on public.party_orders;
create policy "Users can read their own party orders"
  on public.party_orders
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own party orders" on public.party_orders;
create policy "Users can create their own party orders"
  on public.party_orders
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own party orders" on public.party_orders;
create policy "Users can update their own party orders"
  on public.party_orders
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

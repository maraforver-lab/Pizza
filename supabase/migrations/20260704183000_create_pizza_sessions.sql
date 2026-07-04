create table if not exists public.pizza_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'archived')),
  title text not null default 'Active pizza session',
  current_step text,
  session_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists pizza_sessions_user_status_updated_idx
  on public.pizza_sessions (user_id, status, updated_at desc);

alter table public.pizza_sessions enable row level security;

drop policy if exists "Users can read their own pizza sessions" on public.pizza_sessions;
create policy "Users can read their own pizza sessions"
  on public.pizza_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own pizza sessions" on public.pizza_sessions;
create policy "Users can insert their own pizza sessions"
  on public.pizza_sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own pizza sessions" on public.pizza_sessions;
create policy "Users can update their own pizza sessions"
  on public.pizza_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.account_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  allow_early_timed_step_completion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists account_preferences_updated_idx
  on public.account_preferences (updated_at desc);

alter table public.account_preferences enable row level security;

drop policy if exists "Users can read their own account preferences" on public.account_preferences;
create policy "Users can read their own account preferences"
  on public.account_preferences
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own account preferences" on public.account_preferences;
create policy "Users can insert their own account preferences"
  on public.account_preferences
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own account preferences" on public.account_preferences;
create policy "Users can update their own account preferences"
  on public.account_preferences
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

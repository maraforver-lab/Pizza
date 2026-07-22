revoke all on table public.account_preferences from anon;
revoke all on table public.account_preferences from authenticated;

grant select, insert, update on table public.account_preferences to authenticated;

alter table public.account_preferences enable row level security;

drop policy if exists "Users can read their own account preferences" on public.account_preferences;
create policy "Users can read their own account preferences"
  on public.account_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own account preferences" on public.account_preferences;
create policy "Users can insert their own account preferences"
  on public.account_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own account preferences" on public.account_preferences;
create policy "Users can update their own account preferences"
  on public.account_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

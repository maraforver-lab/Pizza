do $$
begin
  create type public.app_role as enum ('basic', 'admin');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'basic',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists user_roles_role_idx
  on public.user_roles (role);

alter table public.user_roles enable row level security;

revoke all on table public.user_roles from public;
revoke all on table public.user_roles from anon;
revoke all on table public.user_roles from authenticated;
grant select on table public.user_roles to supabase_auth_admin;
grant usage on type public.app_role to supabase_auth_admin;

drop policy if exists "Auth hook can read app roles" on public.user_roles;
create policy "Auth hook can read app roles"
  on public.user_roles
  for select
  to supabase_auth_admin
  using (true);

create or replace function public.set_user_roles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_roles_set_updated_at on public.user_roles;
create trigger user_roles_set_updated_at
  before update on public.user_roles
  for each row
  execute function public.set_user_roles_updated_at();

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'basic')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_basic_role on auth.users;
create trigger on_auth_user_created_create_basic_role
  after insert on auth.users
  for each row
  execute function public.handle_new_user_role();

insert into public.user_roles (user_id, role)
select id, 'basic'
from auth.users
on conflict (user_id) do nothing;

create or replace function public.current_user_app_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller_user_id uuid := auth.uid();
  assigned_role public.app_role;
begin
  if caller_user_id is null then
    raise exception 'not_authenticated';
  end if;

  select role
    into assigned_role
  from public.user_roles
  where user_id = caller_user_id
  limit 1;

  return coalesce(assigned_role, 'basic'::public.app_role)::text;
end;
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_app_role() = 'admin';
$$;

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  assigned_role public.app_role;
begin
  select role
    into assigned_role
  from public.user_roles
  where user_id = (event ->> 'user_id')::uuid
  limit 1;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(
    claims,
    '{user_role}',
    to_jsonb(coalesce(assigned_role, 'basic'::public.app_role)::text),
    true
  );

  event := jsonb_set(event, '{claims}', claims, true);
  return event;
end;
$$;

revoke all on function public.set_user_roles_updated_at() from public;
revoke all on function public.handle_new_user_role() from public;
revoke all on function public.current_user_app_role() from public;
revoke all on function public.current_user_app_role() from anon;
revoke all on function public.current_user_app_role() from authenticated;
revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_is_admin() from anon;
revoke all on function public.current_user_is_admin() from authenticated;
revoke all on function public.custom_access_token_hook(jsonb) from public;
revoke all on function public.custom_access_token_hook(jsonb) from anon;
revoke all on function public.custom_access_token_hook(jsonb) from authenticated;

grant execute on function public.current_user_app_role() to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;

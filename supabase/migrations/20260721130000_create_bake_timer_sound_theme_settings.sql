alter table public.account_preferences
  add column if not exists bake_timer_sound_theme text;

do $$
begin
  alter table public.account_preferences
    add constraint account_preferences_bake_timer_sound_theme_check
    check (
      bake_timer_sound_theme is null
      or bake_timer_sound_theme in ('classic', 'bell', 'rooster', 'halloween')
    );
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.bake_timer_sound_theme_settings (
  theme_id text primary key,
  enabled boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  version integer not null default 1,
  constraint bake_timer_sound_theme_settings_theme_id_check
    check (theme_id in ('classic', 'bell', 'rooster', 'halloween')),
  constraint bake_timer_sound_theme_settings_version_check
    check (version >= 1)
);

alter table public.bake_timer_sound_theme_settings enable row level security;

revoke all on table public.bake_timer_sound_theme_settings from public;
revoke all on table public.bake_timer_sound_theme_settings from anon;
revoke all on table public.bake_timer_sound_theme_settings from authenticated;

insert into public.bake_timer_sound_theme_settings (theme_id, enabled, is_default)
values
  ('classic', true, true),
  ('bell', true, false),
  ('rooster', true, false),
  ('halloween', true, false)
on conflict (theme_id) do nothing;

create or replace function public.touch_bake_timer_sound_theme_settings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  return new;
end;
$$;

drop trigger if exists bake_timer_sound_theme_settings_touch on public.bake_timer_sound_theme_settings;
create trigger bake_timer_sound_theme_settings_touch
  before update on public.bake_timer_sound_theme_settings
  for each row execute function public.touch_bake_timer_sound_theme_settings();

create or replace function public.get_bake_timer_sound_configuration()
returns table (
  enabled_theme_ids text[],
  default_theme_id text,
  version integer
)
language sql
security definer
stable
set search_path = public
as $$
  with enabled as (
    select coalesce(
      array_agg(theme_id order by case theme_id when 'classic' then 0 when 'bell' then 1 when 'rooster' then 2 when 'halloween' then 3 else 10 end),
      array[]::text[]
    ) as theme_ids
    from public.bake_timer_sound_theme_settings
    where enabled is true
  ),
  default_setting as (
    select theme_id
    from public.bake_timer_sound_theme_settings
    where enabled is true and is_default is true
    order by updated_at desc
    limit 1
  ),
  version_setting as (
    select coalesce(max(version), 1) as version
    from public.bake_timer_sound_theme_settings
  )
  select
    case
      when cardinality(enabled.theme_ids) = 0 then array['classic']::text[]
      when not ('classic' = any(enabled.theme_ids)) then array_prepend('classic', enabled.theme_ids)
      else enabled.theme_ids
    end,
    coalesce(default_setting.theme_id, 'classic'),
    version_setting.version
  from enabled
  cross join version_setting
  left join default_setting on true;
$$;

create or replace function public.admin_list_bake_timer_sound_theme_settings()
returns table (
  theme_id text,
  enabled boolean,
  is_default boolean,
  updated_at timestamptz,
  version integer
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'admin_required';
  end if;

  return query
  select
    settings.theme_id,
    settings.enabled,
    settings.is_default,
    settings.updated_at,
    settings.version
  from public.bake_timer_sound_theme_settings as settings
  order by case settings.theme_id when 'classic' then 0 when 'bell' then 1 when 'rooster' then 2 when 'halloween' then 3 else 10 end;
end;
$$;

create or replace function public.admin_update_bake_timer_sound_theme_settings(
  p_enabled_theme_ids text[],
  p_default_theme_id text,
  p_expected_version integer
)
returns table (
  theme_id text,
  enabled boolean,
  is_default boolean,
  updated_at timestamptz,
  version integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_theme_ids constant text[] := array['classic', 'bell', 'rooster', 'halloween'];
  current_version integer;
  caller_user_id uuid;
begin
  if not public.current_user_is_admin() then
    raise exception 'admin_required';
  end if;

  caller_user_id := auth.uid();

  select coalesce(max(settings.version), 1)
    into current_version
  from public.bake_timer_sound_theme_settings as settings;

  if p_expected_version is null or p_expected_version <> current_version then
    raise exception 'bake_timer_sound_settings_stale';
  end if;

  if p_enabled_theme_ids is null or cardinality(p_enabled_theme_ids) = 0 then
    raise exception 'bake_timer_sound_theme_invalid';
  end if;

  if not ('classic' = any(p_enabled_theme_ids)) then
    raise exception 'bake_timer_sound_theme_invalid';
  end if;

  if p_default_theme_id is null or not (p_default_theme_id = any(p_enabled_theme_ids)) then
    raise exception 'bake_timer_sound_theme_invalid';
  end if;

  if exists (
    select 1
    from unnest(p_enabled_theme_ids) as candidate(theme_id)
    where not (candidate.theme_id = any(allowed_theme_ids))
  ) or not (p_default_theme_id = any(allowed_theme_ids)) then
    raise exception 'bake_timer_sound_theme_invalid';
  end if;

  update public.bake_timer_sound_theme_settings as settings
  set
    enabled = settings.theme_id = any(p_enabled_theme_ids),
    is_default = settings.theme_id = p_default_theme_id,
    updated_by = caller_user_id
  where settings.theme_id = any(allowed_theme_ids);

  return query
  select
    settings.theme_id,
    settings.enabled,
    settings.is_default,
    settings.updated_at,
    settings.version
  from public.bake_timer_sound_theme_settings as settings
  order by case settings.theme_id when 'classic' then 0 when 'bell' then 1 when 'rooster' then 2 when 'halloween' then 3 else 10 end;
end;
$$;

revoke all on function public.touch_bake_timer_sound_theme_settings() from public;
revoke all on function public.get_bake_timer_sound_configuration() from public;
revoke all on function public.admin_list_bake_timer_sound_theme_settings() from public;
revoke all on function public.admin_update_bake_timer_sound_theme_settings(text[], text, integer) from public;

grant execute on function public.get_bake_timer_sound_configuration() to anon;
grant execute on function public.get_bake_timer_sound_configuration() to authenticated;
grant execute on function public.admin_list_bake_timer_sound_theme_settings() to authenticated;
grant execute on function public.admin_update_bake_timer_sound_theme_settings(text[], text, integer) to authenticated;

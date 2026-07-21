alter table public.account_preferences
  drop constraint if exists account_preferences_bake_timer_sound_theme_check;

alter table public.account_preferences
  add constraint account_preferences_bake_timer_sound_theme_check
  check (
    bake_timer_sound_theme is null
    or bake_timer_sound_theme in ('classic', 'bell', 'rooster', 'halloween', 'dark-commander', 'robot-chef')
  );

alter table public.bake_timer_sound_theme_settings
  drop constraint if exists bake_timer_sound_theme_settings_theme_id_check;

alter table public.bake_timer_sound_theme_settings
  add constraint bake_timer_sound_theme_settings_theme_id_check
  check (theme_id in ('classic', 'bell', 'rooster', 'halloween', 'dark-commander', 'robot-chef'));

insert into public.bake_timer_sound_theme_settings (theme_id, enabled, is_default)
values
  ('dark-commander', true, false),
  ('robot-chef', true, false)
on conflict (theme_id) do nothing;

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
      array_agg(theme_id order by case theme_id when 'classic' then 0 when 'bell' then 1 when 'rooster' then 2 when 'halloween' then 3 when 'dark-commander' then 4 when 'robot-chef' then 5 else 10 end),
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
  order by case settings.theme_id when 'classic' then 0 when 'bell' then 1 when 'rooster' then 2 when 'halloween' then 3 when 'dark-commander' then 4 when 'robot-chef' then 5 else 10 end;
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
  allowed_theme_ids constant text[] := array['classic', 'bell', 'rooster', 'halloween', 'dark-commander', 'robot-chef'];
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
  order by case settings.theme_id when 'classic' then 0 when 'bell' then 1 when 'rooster' then 2 when 'halloween' then 3 when 'dark-commander' then 4 when 'robot-chef' then 5 else 10 end;
end;
$$;

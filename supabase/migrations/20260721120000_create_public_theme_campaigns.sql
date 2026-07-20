create table if not exists public.theme_campaigns (
  id uuid primary key default gen_random_uuid(),
  theme_id text not null,
  enabled boolean not null default true,
  starts_at timestamptz not null,
  ends_at timestamptz null,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint theme_campaigns_theme_id_check check (
    theme_id in (
      'default',
      'valentine',
      'easter',
      'summer',
      'harvest',
      'halloween',
      'christmas'
    )
  ),
  constraint theme_campaigns_end_after_start_check check (
    ends_at is null or ends_at > starts_at
  )
);

create index if not exists theme_campaigns_enabled_window_idx
  on public.theme_campaigns (enabled, starts_at, ends_at);

alter table public.theme_campaigns enable row level security;

revoke all on table public.theme_campaigns from public;
revoke all on table public.theme_campaigns from anon;
revoke all on table public.theme_campaigns from authenticated;

create or replace function public.theme_campaign_status(
  campaign_enabled boolean,
  campaign_starts_at timestamptz,
  campaign_ends_at timestamptz,
  checked_at timestamptz default now()
)
returns text
language sql
stable
as $$
  select case
    when campaign_enabled is false then 'disabled'
    when campaign_ends_at is not null and checked_at >= campaign_ends_at then 'expired'
    when checked_at < campaign_starts_at then 'scheduled'
    else 'active'
  end;
$$;

create or replace function public.get_active_public_theme(checked_at timestamptz default now())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select theme_id
    from public.theme_campaigns
    where enabled is true
      and theme_id <> 'default'
      and starts_at <= checked_at
      and (ends_at is null or checked_at < ends_at)
    order by starts_at desc, created_at desc
    limit 1
  ), 'default');
$$;

create or replace function public.theme_campaign_overlaps(
  candidate_id uuid,
  candidate_theme_id text,
  candidate_starts_at timestamptz,
  candidate_ends_at timestamptz
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.theme_campaigns existing
    where existing.enabled is true
      and existing.theme_id <> 'default'
      and existing.id is distinct from candidate_id
      and candidate_theme_id <> 'default'
      and tstzrange(existing.starts_at, coalesce(existing.ends_at, 'infinity'::timestamptz), '[)')
        && tstzrange(candidate_starts_at, coalesce(candidate_ends_at, 'infinity'::timestamptz), '[)')
  );
$$;

create or replace function public.require_theme_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  caller_user_id uuid := auth.uid();
begin
  if caller_user_id is null or public.current_user_is_admin() is not true then
    raise exception 'theme_admin_required' using errcode = '42501';
  end if;

  return caller_user_id;
end;
$$;

create or replace function public.admin_list_theme_campaigns(checked_at timestamptz default now())
returns table (
  id uuid,
  theme_id text,
  enabled boolean,
  starts_at timestamptz,
  ends_at timestamptz,
  version integer,
  created_at timestamptz,
  updated_at timestamptz,
  status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_theme_admin();

  return query
    select
      campaign.id,
      campaign.theme_id,
      campaign.enabled,
      campaign.starts_at,
      campaign.ends_at,
      campaign.version,
      campaign.created_at,
      campaign.updated_at,
      public.theme_campaign_status(campaign.enabled, campaign.starts_at, campaign.ends_at, checked_at) as status
    from public.theme_campaigns campaign
    order by campaign.starts_at desc, campaign.created_at desc;
end;
$$;

create or replace function public.admin_create_theme_campaign(
  p_theme_id text,
  p_starts_at timestamptz,
  p_ends_at timestamptz default null
)
returns table (
  id uuid,
  theme_id text,
  enabled boolean,
  starts_at timestamptz,
  ends_at timestamptz,
  version integer,
  created_at timestamptz,
  updated_at timestamptz,
  status text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  caller_user_id uuid := public.require_theme_admin();
begin
  if p_theme_id not in ('default', 'valentine', 'easter', 'summer', 'harvest', 'halloween', 'christmas') then
    raise exception 'theme_campaign_invalid_theme' using errcode = '22023';
  end if;

  if p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'theme_campaign_invalid_range' using errcode = '22023';
  end if;

  if p_theme_id = 'default' then
    update public.theme_campaigns
      set enabled = false,
          updated_by = caller_user_id,
          updated_at = now(),
          version = version + 1
      where enabled is true;
  elsif public.theme_campaign_overlaps(null, p_theme_id, p_starts_at, p_ends_at) then
    raise exception 'theme_campaign_overlap' using errcode = '23505';
  end if;

  return query
    with inserted as (
      insert into public.theme_campaigns (theme_id, starts_at, ends_at, created_by, updated_by)
      values (p_theme_id, p_starts_at, p_ends_at, caller_user_id, caller_user_id)
      returning *
    )
    select
      inserted.id,
      inserted.theme_id,
      inserted.enabled,
      inserted.starts_at,
      inserted.ends_at,
      inserted.version,
      inserted.created_at,
      inserted.updated_at,
      public.theme_campaign_status(inserted.enabled, inserted.starts_at, inserted.ends_at, now()) as status
    from inserted;
end;
$$;

create or replace function public.admin_update_theme_campaign(
  p_id uuid,
  p_expected_version integer,
  p_theme_id text,
  p_enabled boolean,
  p_starts_at timestamptz,
  p_ends_at timestamptz default null
)
returns table (
  id uuid,
  theme_id text,
  enabled boolean,
  starts_at timestamptz,
  ends_at timestamptz,
  version integer,
  created_at timestamptz,
  updated_at timestamptz,
  status text
)
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  caller_user_id uuid := public.require_theme_admin();
  existing_version integer;
begin
  select campaign.version into existing_version
  from public.theme_campaigns campaign
  where campaign.id = p_id;

  if existing_version is null then
    raise exception 'theme_campaign_not_found' using errcode = 'P0002';
  end if;

  if existing_version <> p_expected_version then
    raise exception 'theme_campaign_stale' using errcode = '40001';
  end if;

  if p_theme_id not in ('default', 'valentine', 'easter', 'summer', 'harvest', 'halloween', 'christmas') then
    raise exception 'theme_campaign_invalid_theme' using errcode = '22023';
  end if;

  if p_ends_at is not null and p_ends_at <= p_starts_at then
    raise exception 'theme_campaign_invalid_range' using errcode = '22023';
  end if;

  if p_enabled is true and public.theme_campaign_overlaps(p_id, p_theme_id, p_starts_at, p_ends_at) then
    raise exception 'theme_campaign_overlap' using errcode = '23505';
  end if;

  return query
    with updated as (
      update public.theme_campaigns
      set theme_id = p_theme_id,
          enabled = p_enabled,
          starts_at = p_starts_at,
          ends_at = p_ends_at,
          updated_by = caller_user_id,
          updated_at = now(),
          version = version + 1
      where public.theme_campaigns.id = p_id
      returning *
    )
    select
      updated.id,
      updated.theme_id,
      updated.enabled,
      updated.starts_at,
      updated.ends_at,
      updated.version,
      updated.created_at,
      updated.updated_at,
      public.theme_campaign_status(updated.enabled, updated.starts_at, updated.ends_at, now()) as status
    from updated;
end;
$$;

create or replace function public.admin_delete_theme_campaign(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  caller_user_id uuid := public.require_theme_admin();
  deleted_count integer;
begin
  delete from public.theme_campaigns
  where id = p_id
  returning 1 into deleted_count;

  if deleted_count is null then
    raise exception 'theme_campaign_not_found' using errcode = 'P0002';
  end if;

  perform caller_user_id;
end;
$$;

create or replace function public.admin_activate_default_theme()
returns integer
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  caller_user_id uuid := public.require_theme_admin();
  changed_count integer;
begin
  update public.theme_campaigns
    set enabled = false,
        updated_by = caller_user_id,
        updated_at = now(),
        version = version + 1
    where enabled is true
      and theme_id <> 'default';

  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;

grant execute on function public.get_active_public_theme(timestamptz) to anon, authenticated;
grant execute on function public.admin_list_theme_campaigns(timestamptz) to authenticated;
grant execute on function public.admin_create_theme_campaign(text, timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_update_theme_campaign(uuid, integer, text, boolean, timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_delete_theme_campaign(uuid) to authenticated;
grant execute on function public.admin_activate_default_theme() to authenticated;

revoke all on function public.theme_campaign_status(boolean, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.theme_campaign_overlaps(uuid, text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.require_theme_admin() from public, anon, authenticated;

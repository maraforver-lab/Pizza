create or replace function public.admin_activate_theme_now(p_theme_id text)
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
  activation_time timestamptz := now();
  has_overlap boolean;
begin
  if p_theme_id = 'default' then
    raise exception 'theme_campaign_invalid_theme' using errcode = '22023';
  end if;

  if p_theme_id not in ('valentine', 'easter', 'summer', 'harvest', 'halloween', 'christmas') then
    raise exception 'theme_campaign_invalid_theme' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('public.theme_campaigns.activate_now'));

  update public.theme_campaigns
    set enabled = false,
        updated_by = caller_user_id,
        updated_at = activation_time,
        version = version + 1
    where enabled is true
      and theme_id <> 'default'
      and starts_at <= activation_time
      and (ends_at is null or activation_time < ends_at);

  select exists (
    select 1
    from public.theme_campaigns existing
    where existing.enabled is true
      and existing.theme_id <> 'default'
      and tstzrange(existing.starts_at, coalesce(existing.ends_at, 'infinity'::timestamptz), '[)')
        && tstzrange(activation_time, 'infinity'::timestamptz, '[)')
  ) into has_overlap;

  if has_overlap then
    raise exception 'theme_campaign_overlap' using errcode = '23505';
  end if;

  return query
    with inserted as (
      insert into public.theme_campaigns (theme_id, starts_at, ends_at, created_by, updated_by)
      values (p_theme_id, activation_time, null, caller_user_id, caller_user_id)
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
      public.theme_campaign_status(inserted.enabled, inserted.starts_at, inserted.ends_at, activation_time) as status
    from inserted;
end;
$$;

grant execute on function public.admin_activate_theme_now(text) to authenticated;

notify pgrst, 'reload schema';

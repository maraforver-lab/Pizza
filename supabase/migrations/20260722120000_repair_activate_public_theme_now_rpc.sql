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

  update public.theme_campaigns as active_campaign
    set enabled = false,
        updated_by = caller_user_id,
        updated_at = activation_time,
        version = active_campaign.version + 1
    where active_campaign.enabled is true
      and active_campaign.theme_id <> 'default'
      and active_campaign.starts_at <= activation_time
      and (active_campaign.ends_at is null or activation_time < active_campaign.ends_at);

  select exists (
    select 1
    from public.theme_campaigns as future_campaign
    where future_campaign.enabled is true
      and future_campaign.theme_id <> 'default'
      and tstzrange(future_campaign.starts_at, coalesce(future_campaign.ends_at, 'infinity'::timestamptz), '[)')
        && tstzrange(activation_time, 'infinity'::timestamptz, '[)')
  ) into has_overlap;

  if has_overlap then
    raise exception 'theme_campaign_overlap' using errcode = '23505';
  end if;

  return query
    with inserted_campaign as (
      insert into public.theme_campaigns (theme_id, starts_at, ends_at, created_by, updated_by)
      values (p_theme_id, activation_time, null, caller_user_id, caller_user_id)
      returning
        public.theme_campaigns.id,
        public.theme_campaigns.theme_id,
        public.theme_campaigns.enabled,
        public.theme_campaigns.starts_at,
        public.theme_campaigns.ends_at,
        public.theme_campaigns.version,
        public.theme_campaigns.created_at,
        public.theme_campaigns.updated_at
    )
    select
      inserted_campaign.id,
      inserted_campaign.theme_id,
      inserted_campaign.enabled,
      inserted_campaign.starts_at,
      inserted_campaign.ends_at,
      inserted_campaign.version,
      inserted_campaign.created_at,
      inserted_campaign.updated_at,
      public.theme_campaign_status(
        inserted_campaign.enabled,
        inserted_campaign.starts_at,
        inserted_campaign.ends_at,
        activation_time
      ) as status
    from inserted_campaign;
end;
$$;

grant execute on function public.admin_activate_theme_now(text) to authenticated;

notify pgrst, 'reload schema';

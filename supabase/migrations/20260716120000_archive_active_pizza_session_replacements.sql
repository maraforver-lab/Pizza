alter table public.pizza_sessions
  add column if not exists archived_at timestamptz;

-- Historical duplicate active rows were already hidden by the application,
-- which always selected the newest in_progress row. Preserve the newest row as
-- active and archive older duplicates before adding the database constraint.
with ranked_active_sessions as (
  select
    id,
    row_number() over (
      partition by user_id
      order by updated_at desc, created_at desc, id desc
    ) as active_rank
  from public.pizza_sessions
  where status = 'in_progress'
)
update public.pizza_sessions
set
  status = 'archived',
  archived_at = coalesce(archived_at, timezone('utc', now()))
where id in (
  select id
  from ranked_active_sessions
  where active_rank > 1
);

create unique index if not exists pizza_sessions_one_active_per_user_idx
  on public.pizza_sessions (user_id)
  where status = 'in_progress';

create or replace function public.archive_active_and_create_pizza_session(
  new_session_data jsonb,
  new_current_step text default null,
  new_title text default 'Active pizza session'
)
returns table (
  id uuid,
  user_id uuid,
  status text,
  title text,
  current_step text,
  session_data jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  archived_session_row_id uuid,
  archived_session_data_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_user_id uuid := auth.uid();
  incoming_session_id text := nullif(new_session_data ->> 'id', '');
  replacement_time timestamptz := timezone('utc', now());
  existing_active public.pizza_sessions%rowtype;
  same_active public.pizza_sessions%rowtype;
  new_active public.pizza_sessions%rowtype;
begin
  if caller_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if new_session_data is null
    or jsonb_typeof(new_session_data) <> 'object'
    or incoming_session_id is null then
    raise exception 'invalid_session_data';
  end if;

  select *
    into same_active
  from public.pizza_sessions
  where user_id = caller_user_id
    and status = 'in_progress'
    and session_data ->> 'id' = incoming_session_id
  order by updated_at desc, created_at desc, id desc
  limit 1
  for update;

  if found then
    return query
    select
      same_active.id,
      same_active.user_id,
      same_active.status,
      same_active.title,
      same_active.current_step,
      same_active.session_data,
      same_active.created_at,
      same_active.updated_at,
      same_active.completed_at,
      same_active.archived_at,
      null::uuid,
      null::text;
    return;
  end if;

  select *
    into existing_active
  from public.pizza_sessions
  where user_id = caller_user_id
    and status = 'in_progress'
  order by updated_at desc, created_at desc, id desc
  limit 1
  for update;

  if found then
    update public.pizza_sessions
    set
      status = 'archived',
      archived_at = coalesce(archived_at, replacement_time)
    where id = existing_active.id
      and user_id = caller_user_id
      and status = 'in_progress'
    returning * into existing_active;
  end if;

  insert into public.pizza_sessions (
    user_id,
    status,
    title,
    current_step,
    session_data,
    created_at,
    updated_at,
    completed_at,
    archived_at
  )
  values (
    caller_user_id,
    'in_progress',
    coalesce(nullif(trim(new_title), ''), 'Active pizza session'),
    new_current_step,
    new_session_data,
    replacement_time,
    replacement_time,
    null,
    null
  )
  returning * into new_active;

  return query
  select
    new_active.id,
    new_active.user_id,
    new_active.status,
    new_active.title,
    new_active.current_step,
    new_active.session_data,
    new_active.created_at,
    new_active.updated_at,
    new_active.completed_at,
    new_active.archived_at,
    case when existing_active.id is null then null::uuid else existing_active.id end,
    case when existing_active.id is null then null::text else existing_active.session_data ->> 'id' end;
end;
$$;

revoke all on function public.archive_active_and_create_pizza_session(jsonb, text, text) from public;
grant execute on function public.archive_active_and_create_pizza_session(jsonb, text, text) to authenticated;

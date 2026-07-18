-- Patch 434B: no-archive active Pizza Session replacement.
-- Existing archived unfinished sessions are permanently deleted here by exact
-- status match. Active and completed rows are intentionally not matched.

delete from public.pizza_sessions
where status = 'archived';

create or replace function public.replace_active_pizza_session(
  new_session_data jsonb,
  new_current_step text default null,
  new_title text default 'Active pizza session',
  expected_active_row_id uuid default null,
  expected_active_session_id text default null
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
  archived_at timestamptz
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
      same_active.archived_at;
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
    if expected_active_row_id is not null and existing_active.id <> expected_active_row_id then
      raise exception 'active_session_conflict';
    end if;

    if expected_active_session_id is not null
      and existing_active.session_data ->> 'id' <> expected_active_session_id then
      raise exception 'active_session_conflict';
    end if;

    delete from public.pizza_sessions
    where id = existing_active.id
      and user_id = caller_user_id
      and status = 'in_progress';
  elsif expected_active_row_id is not null or expected_active_session_id is not null then
    raise exception 'active_session_conflict';
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
    new_active.archived_at;
end;
$$;

revoke all on function public.replace_active_pizza_session(jsonb, text, text, uuid, text) from public;
grant execute on function public.replace_active_pizza_session(jsonb, text, text, uuid, text) to authenticated;

drop function if exists public.archive_active_and_create_pizza_session(jsonb, text, text);

drop policy if exists "Users can delete their own pizza sessions" on public.pizza_sessions;
create policy "Users can delete their own pizza sessions"
  on public.pizza_sessions
  for delete
  using (auth.uid() = user_id and status in ('in_progress', 'completed'));

create or replace function public.trim_pizza_session_retention_for_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    return;
  end if;

  if auth.uid() is not null and auth.uid() <> target_user_id then
    raise exception 'not_authorized';
  end if;

  delete from public.pizza_sessions
  where id in (
    select id
    from (
      select
        id,
        row_number() over (
          partition by user_id
          order by coalesce(completed_at, updated_at, created_at) desc, updated_at desc, created_at desc, id desc
        ) as retained_rank
      from public.pizza_sessions
      where user_id = target_user_id
        and status = 'completed'
    ) ranked_completed_sessions
    where retained_rank > 15
  );
end;
$$;

create or replace function public.enforce_pizza_session_retention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' then
    perform public.trim_pizza_session_retention_for_user(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists pizza_session_retention_after_write on public.pizza_sessions;
create trigger pizza_session_retention_after_write
  after insert or update of status, completed_at on public.pizza_sessions
  for each row
  when (new.status = 'completed')
  execute function public.enforce_pizza_session_retention();

with ranked_completed_sessions as (
  select
    id,
    row_number() over (
      partition by user_id
      order by coalesce(completed_at, updated_at, created_at) desc, updated_at desc, created_at desc, id desc
    ) as retained_rank
  from public.pizza_sessions
  where status = 'completed'
)
delete from public.pizza_sessions
where id in (
  select id
  from ranked_completed_sessions
  where retained_rank > 15
);

alter table public.pizza_sessions
  drop constraint if exists pizza_sessions_status_check;

alter table public.pizza_sessions
  add constraint pizza_sessions_status_check
  check (status in ('in_progress', 'completed'));

create unique index if not exists pizza_sessions_one_active_per_user_idx
  on public.pizza_sessions (user_id)
  where status = 'in_progress';

revoke all on function public.trim_pizza_session_retention_for_user(uuid) from public;
grant execute on function public.trim_pizza_session_retention_for_user(uuid) to authenticated;

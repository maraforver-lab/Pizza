-- Session names live in session_data.sessionName and the existing title column
-- remains a denormalized display/search label for account lists.

grant delete on public.pizza_sessions to authenticated;

drop policy if exists "Users can delete their own pizza sessions" on public.pizza_sessions;
create policy "Users can delete their own pizza sessions"
  on public.pizza_sessions
  for delete
  using (auth.uid() = user_id and status in ('archived', 'completed'));

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
          order by coalesce(archived_at, updated_at, created_at) desc, updated_at desc, created_at desc, id desc
        ) as retained_rank
      from public.pizza_sessions
      where user_id = target_user_id
        and status = 'archived'
    ) ranked_archived_sessions
    where retained_rank > 3
  );

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
  if new.status in ('archived', 'completed') then
    perform public.trim_pizza_session_retention_for_user(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists pizza_session_retention_after_write on public.pizza_sessions;
create trigger pizza_session_retention_after_write
  after insert or update of status, archived_at, completed_at on public.pizza_sessions
  for each row
  when (new.status in ('archived', 'completed'))
  execute function public.enforce_pizza_session_retention();

with ranked_archived_sessions as (
  select
    id,
    row_number() over (
      partition by user_id
      order by coalesce(archived_at, updated_at, created_at) desc, updated_at desc, created_at desc, id desc
    ) as retained_rank
  from public.pizza_sessions
  where status = 'archived'
)
delete from public.pizza_sessions
where id in (
  select id
  from ranked_archived_sessions
  where retained_rank > 3
);

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

revoke all on function public.trim_pizza_session_retention_for_user(uuid) from public;
grant execute on function public.trim_pizza_session_retention_for_user(uuid) to authenticated;

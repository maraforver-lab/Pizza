# Admin Bootstrap

Patch 444B adds the secure role foundation for DoughTools administration. It does not assign any admin role automatically.

## Role Model

- `public.user_roles` is the authoritative role source.
- Supported roles are `basic` and `admin`.
- Every existing and new authenticated user receives `basic` unless a trusted operator changes that row.
- The Supabase Custom Access Token Hook copies the role into the JWT claim `user_role`.
- Server-side `/admin` access re-checks `public.user_roles` through the authenticated database boundary; client state is never authoritative.

## Required Sequence

1. Review the Patch 444B migration.
2. Apply the Supabase migration.
3. Enable the Supabase Custom Access Token Hook in the Dashboard and select:

```text
public.custom_access_token_hook
```

4. Locate the product owner's exact Supabase Auth user UUID in a trusted Dashboard or linked CLI context.
5. Verify the UUID belongs to the intended account.
6. Run the bootstrap SQL below.
7. Verify exactly one row is `admin`.
8. Sign out and sign back in, or explicitly refresh the session token.
9. Open `/admin`.
10. Verify a basic signed-in test account receives no access.
11. Record the operation outside public application code according to current operational practice.

## Bootstrap SQL

Use a real Auth UUID only when running the command in a trusted SQL context. Do not commit a real UUID, email address, token or secret.

```sql
begin;

insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where id = '<AUTH_USER_UUID>'::uuid
on conflict (user_id) do update
set
  role = 'admin',
  updated_at = timezone('utc', now());

do $$
declare
  changed_count integer;
begin
  select count(*)
    into changed_count
  from public.user_roles
  where user_id = '<AUTH_USER_UUID>'::uuid
    and role = 'admin';

  if changed_count <> 1 then
    raise exception 'Expected exactly one admin role row for bootstrap target, found %', changed_count;
  end if;
end;
$$;

select user_id, role, updated_at
from public.user_roles
where user_id = '<AUTH_USER_UUID>'::uuid;

commit;
```

## Revocation SQL

```sql
begin;

update public.user_roles
set
  role = 'basic',
  updated_at = timezone('utc', now())
where user_id = '<AUTH_USER_UUID>'::uuid;

select user_id, role, updated_at
from public.user_roles
where user_id = '<AUTH_USER_UUID>'::uuid;

commit;
```

## Do Not Use

Do not create a public bootstrap endpoint.

Do not create or use:

- a public bootstrap route;
- a secret query parameter;
- a "first visitor becomes admin" mechanism;
- Account preferences;
- browser localStorage;
- user metadata;
- email-based runtime authorization.

## Token Freshness

Changing `public.user_roles` takes effect immediately for server-side admin guards because they query the authoritative role source. Existing JWTs may still contain a stale `user_role` claim until token refresh. After promotion or revocation, the affected user should sign out and sign back in or refresh the Supabase session.

## Rollback

- Demote an admin by setting the row back to `basic`.
- Disable `/admin` in the application if needed.
- Disable the Supabase Auth Hook if token claims must stop.
- Keep `public.user_roles` in place unless a full database rollback is required; `basic` rows are harmless and useful for future aggregate counts.

Patch 444B does not add seasonal themes, sound themes, registered-user counts, private user browsing or role-management UI.

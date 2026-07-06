alter table public.party_orders
  drop constraint if exists party_orders_status_check;

alter table public.party_orders
  add constraint party_orders_status_check
  check (status in ('open', 'closed', 'archived'));

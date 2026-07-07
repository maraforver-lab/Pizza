grant delete on public.party_order_submissions to authenticated;

drop policy if exists "Owners can delete their party order submissions" on public.party_order_submissions;
create policy "Owners can delete their party order submissions"
  on public.party_order_submissions
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.party_orders
      where party_orders.id = party_order_submissions.party_order_id
        and party_orders.user_id = auth.uid()
    )
  );

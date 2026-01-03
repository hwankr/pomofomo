-- Allow group leaders to transfer leadership to another member.
-- Replaces the existing update policy on public.groups.

drop policy if exists "Leaders can update their groups" on public.groups;

create policy "Leaders can update their groups" on public.groups
  for update
  using (auth.uid() = leader_id)
  with check (
    auth.uid() = leader_id
    OR exists (
      select 1
      from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = groups.leader_id
    )
  );

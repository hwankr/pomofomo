create table if not exists public.push_subscriptions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamp with time zone not null default now(),
  constraint push_subscriptions_pkey primary key (id),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Users can insert their own subscriptions"
on public.push_subscriptions
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

create policy "Users can view their own subscriptions"
on public.push_subscriptions
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

create policy "Users can delete their own subscriptions"
on public.push_subscriptions
for delete
to authenticated
using (
  (select auth.uid()) = user_id
);

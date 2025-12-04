create table if not exists public.debug_logs (
  id uuid not null default gen_random_uuid (),
  message text,
  details jsonb,
  created_at timestamp with time zone not null default now(),
  constraint debug_logs_pkey primary key (id)
);

alter table public.debug_logs enable row level security;

create policy "Allow insert for everyone"
on public.debug_logs
for insert
to public
with check (true);

create policy "Allow select for everyone"
on public.debug_logs
for select
to public
using (true);

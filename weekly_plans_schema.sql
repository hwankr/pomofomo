-- Create weekly_plans table
create table public.weekly_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  start_date date not null,
  end_date date not null,
  status text check (status in ('todo', 'in_progress', 'done')) default 'todo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.weekly_plans enable row level security;

-- Create policies
create policy "Users can view their own weekly plans"
  on public.weekly_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own weekly plans"
  on public.weekly_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own weekly plans"
  on public.weekly_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own weekly plans"
  on public.weekly_plans for delete
  using (auth.uid() = user_id);

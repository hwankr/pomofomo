alter table profiles
add column if not exists total_stopwatch_time bigint default 0;

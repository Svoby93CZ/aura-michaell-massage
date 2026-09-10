-- Spusťte celý soubor v Supabase SQL Editoru.
create table if not exists public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(trim(nickname)) between 2 and 60),
  rating smallint check (rating is null or rating between 1 and 5),
  message text not null check (char_length(trim(message)) between 3 and 1000),
  approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists guestbook_entries_public_idx
  on public.guestbook_entries (approved, created_at desc);

create table if not exists public.guestbook_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.guestbook_entries enable row level security;
alter table public.guestbook_admins enable row level security;

drop policy if exists "Anyone can read approved entries" on public.guestbook_entries;
create policy "Anyone can read approved entries"
  on public.guestbook_entries for select
  to anon, authenticated
  using (approved = true or exists (
    select 1 from public.guestbook_admins
    where user_id = auth.uid()
  ));

drop policy if exists "Anyone can submit an entry" on public.guestbook_entries;
create policy "Anyone can submit an entry"
  on public.guestbook_entries for insert
  to anon, authenticated
  with check (approved = false);

drop policy if exists "Admins can update entries" on public.guestbook_entries;
create policy "Admins can update entries"
  on public.guestbook_entries for update
  to authenticated
  using (exists (
    select 1 from public.guestbook_admins
    where user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.guestbook_admins
    where user_id = auth.uid()
  ));

drop policy if exists "Admins can delete entries" on public.guestbook_entries;
create policy "Admins can delete entries"
  on public.guestbook_entries for delete
  to authenticated
  using (exists (
    select 1 from public.guestbook_admins
    where user_id = auth.uid()
  ));

drop policy if exists "Admins can read their access row" on public.guestbook_admins;
create policy "Admins can read their access row"
  on public.guestbook_admins for select
  to authenticated
  using (user_id = auth.uid());
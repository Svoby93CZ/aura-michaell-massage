-- Spusťte celý soubor v Supabase SQL Editoru.
-- Vytvoří tabulku ceníku masáží, kterou spravuje admin.html.
-- Naplnění daty: následně spusťte supabase-services-seed.sql.

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category text not null check (char_length(trim(category)) between 2 and 40),
  name text not null check (char_length(trim(name)) between 1 and 120),
  slug text not null default '',
  description text not null default '',
  duration_minutes integer not null check (duration_minutes between 1 and 600),
  price_czk integer not null check (price_czk between 0 and 100000),
  image_path text,
  image_alt text,
  reservio_url text,
  recommended boolean not null default false,
  badge_text text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists services_public_idx
  on public.services (active, category, sort_order);

-- updated_at se udržuje automaticky, aby se na něj nemuselo myslet v JS.
create or replace function public.services_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists services_touch_updated_at_trigger on public.services;
create trigger services_touch_updated_at_trigger
before update on public.services
for each row execute function public.services_touch_updated_at();

alter table public.services enable row level security;

-- Veřejný web čte jen aktivní služby; správce vidí i skryté.
drop policy if exists "Anyone can read active services" on public.services;
create policy "Anyone can read active services"
  on public.services for select
  to anon, authenticated
  using (active = true or exists (
    select 1 from public.guestbook_admins
    where user_id = auth.uid()
  ));

-- Zápis je výhradně pro správce z tabulky guestbook_admins.
drop policy if exists "Admins can insert services" on public.services;
create policy "Admins can insert services"
  on public.services for insert
  to authenticated
  with check (exists (
    select 1 from public.guestbook_admins
    where user_id = auth.uid()
  ));

drop policy if exists "Admins can update services" on public.services;
create policy "Admins can update services"
  on public.services for update
  to authenticated
  using (exists (
    select 1 from public.guestbook_admins
    where user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.guestbook_admins
    where user_id = auth.uid()
  ));

drop policy if exists "Admins can delete services" on public.services;
create policy "Admins can delete services"
  on public.services for delete
  to authenticated
  using (exists (
    select 1 from public.guestbook_admins
    where user_id = auth.uid()
  ));

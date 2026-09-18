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

-- ============================================
-- OCHRANA PROTI SPAMU: rate-limit podle IP adresy
-- ============================================
-- Oddelena tabulka od guestbook_entries, aby se IP adresy nemisily
-- s verejne zobrazovanym obsahem vzkazu.
create table if not exists public.guestbook_rate_limit (
  id bigint generated always as identity primary key,
  client_ip text not null,
  submitted_at timestamptz not null default timezone('utc', now())
);

create index if not exists guestbook_rate_limit_ip_idx
  on public.guestbook_rate_limit (client_ip, submitted_at desc);

alter table public.guestbook_rate_limit enable row level security;
-- Zadna RLS policy pro anon/authenticated - tabulka je pristupna jen
-- pres SECURITY DEFINER funkci nize (bezi s pravy vlastnika funkce,
-- ktery RLS bypassuje).

create or replace function public.guestbook_check_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip text;
  v_recent_count int;
  v_daily_count int;
begin
  begin
    v_ip := coalesce(
      nullif(current_setting('request.headers', true)::json ->> 'cf-connecting-ip', ''),
      nullif(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), '')
    );
  exception when others then
    v_ip := null;
  end;

  -- Pokud se IP adresu nepodari zjistit, rate-limit pro tento pozadavek
  -- preskocime (fail-open) - jde o ochranu proti spamu, ne o kriticke
  -- zabezpeceni, a nechceme kvuli chybe v parsovani headeru rozbit
  -- moznost odeslat vzkaz legitimnimu navstevnikovi.
  if v_ip is null then
    return new;
  end if;

  select count(*) into v_recent_count
  from public.guestbook_rate_limit
  where client_ip = v_ip and submitted_at > now() - interval '10 minutes';

  if v_recent_count >= 3 then
    raise exception 'Příliš mnoho vzkazů z této adresy. Zkuste to prosím znovu za chvíli.';
  end if;

  select count(*) into v_daily_count
  from public.guestbook_rate_limit
  where client_ip = v_ip and submitted_at > now() - interval '24 hours';

  if v_daily_count >= 8 then
    raise exception 'Dosáhli jste denního limitu vzkazů z této adresy. Zkuste to prosím zítra.';
  end if;

  insert into public.guestbook_rate_limit (client_ip) values (v_ip);
  delete from public.guestbook_rate_limit where submitted_at < now() - interval '2 days';

  return new;
end;
$$;

-- guestbook_check_rate_limit je urcena vyhradne jako BEFORE INSERT trigger.
-- Jako SECURITY DEFINER funkce v public schematu by ji PostgREST jinak
-- automaticky vystavil i jako verejne volatelne RPC - to tu odebirame.
revoke execute on function public.guestbook_check_rate_limit() from public, anon, authenticated;

drop trigger if exists guestbook_rate_limit_trigger on public.guestbook_entries;
create trigger guestbook_rate_limit_trigger
before insert on public.guestbook_entries
for each row execute function public.guestbook_check_rate_limit();
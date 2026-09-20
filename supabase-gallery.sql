-- Spusťte celý soubor v Supabase SQL Editoru.
-- Vytvoří tabulku fotek galerie, kterou spravuje admin.html.
-- Zatím se používá jen galerie 'home-prostor' = sekce
-- „Prostor a atmosféra salonu“ na hlavní stránce.

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  gallery text not null default 'home-prostor' check (char_length(trim(gallery)) between 2 and 40),
  image_path text not null check (char_length(trim(image_path)) between 3 and 300),
  alt_text text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists gallery_images_public_idx
  on public.gallery_images (gallery, active, sort_order);

create or replace function public.gallery_images_touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists gallery_images_touch_updated_at_trigger on public.gallery_images;
create trigger gallery_images_touch_updated_at_trigger
before update on public.gallery_images
for each row execute function public.gallery_images_touch_updated_at();

alter table public.gallery_images enable row level security;

-- Veřejný web čte jen zobrazované fotky; správce vidí i skryté.
drop policy if exists "Anyone can read active gallery images" on public.gallery_images;
create policy "Anyone can read active gallery images"
  on public.gallery_images for select
  to anon, authenticated
  using (active = true or exists (
    select 1 from public.guestbook_admins where user_id = auth.uid()
  ));

drop policy if exists "Admins can insert gallery images" on public.gallery_images;
create policy "Admins can insert gallery images"
  on public.gallery_images for insert
  to authenticated
  with check (exists (
    select 1 from public.guestbook_admins where user_id = auth.uid()
  ));

drop policy if exists "Admins can update gallery images" on public.gallery_images;
create policy "Admins can update gallery images"
  on public.gallery_images for update
  to authenticated
  using (exists (select 1 from public.guestbook_admins where user_id = auth.uid()))
  with check (exists (select 1 from public.guestbook_admins where user_id = auth.uid()));

drop policy if exists "Admins can delete gallery images" on public.gallery_images;
create policy "Admins can delete gallery images"
  on public.gallery_images for delete
  to authenticated
  using (exists (select 1 from public.guestbook_admins where user_id = auth.uid()));

-- Prvotní naplnění fotkami, které byly v index.html.
insert into public.gallery_images (gallery, image_path, alt_text, sort_order) values
  ('home-prostor', 'galerie/lampa(1).webp', 'Masážní lampa osvětluje lehátko', 10),
  ('home-prostor', 'galerie/navsteva.webp', 'Návštěva salonu Aura Michaell Massage', 20),
  ('home-prostor', 'galerie/oleje.webp', 'Masážní oleje', 30),
  ('home-prostor', 'galerie/shop3.webp', 'Produkt Aura Michaell Massage', 40),
  ('home-prostor', 'galerie/caj.webp', 'Čajový koutek v salonu', 50),
  ('home-prostor', 'galerie/kakao.webp', 'Produkt Aura Michaell Massage', 60),
  ('home-prostor', 'galerie/prostor.webp', 'Masáž jako prostor pro uvolnění', 70)
on conflict do nothing;

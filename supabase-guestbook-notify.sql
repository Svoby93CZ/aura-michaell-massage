-- Upozornění e-mailem na nový vzkaz v knize návštěv.
-- Spusťte celý soubor v Supabase SQL Editoru (až po supabase-guestbook.sql).
--
-- Po každém novém vzkazu databáze sama pošle e-mail přes službu Resend
-- (resend.com, zdarma do 100 e-mailů denně). Dokud nejsou v trezoru (Vault)
-- uložené klíč a adresa, trigger nic neposílá.
--
-- Klíč a adresy se ukládají do Supabase Vault, ne sem - tenhle soubor je
-- veřejný na GitHubu:
--
--   select vault.create_secret('re_VAS_KLIC', 'guestbook_resend_api_key');
--   select vault.create_secret('vas@email.cz', 'guestbook_notify_to');
--
-- Volitelně odesílatel (jen s doménou ověřenou v Resend):
--
--   select vault.create_secret('Kniha návštěv <web@auramichaell.cz>', 'guestbook_notify_from');

-- pg_net posílá HTTP požadavky na pozadí, až po uložení vzkazu,
-- takže odeslání formuláře kvůli e-mailu nezdržuje.
create extension if not exists pg_net with schema extensions;

create or replace function public.guestbook_notify_new_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_api_key text;
  v_to jsonb;
  v_from text;
  v_recent_count int;
  v_nickname text;
  v_text text;
begin
  select decrypted_secret into v_api_key
  from vault.decrypted_secrets where name = 'guestbook_resend_api_key';

  -- Víc příjemců jde zadat oddělených čárkou.
  select jsonb_agg(btrim(address)) into v_to
  from vault.decrypted_secrets,
       unnest(string_to_array(decrypted_secret, ',')) as address
  where name = 'guestbook_notify_to' and btrim(address) <> '';

  if v_api_key is null or v_to is null then
    return new;
  end if;

  -- Pojistka proti záplavě: při útoku z mnoha adres najednou (rate-limit
  -- hlídá jednotlivé IP) by jinak přišly desítky e-mailů a vyčerpal se
  -- denní limit Resend. Vzkazy se uloží dál, jen bez dalších upozornění.
  select count(*) into v_recent_count
  from public.guestbook_entries
  where created_at > now() - interval '1 hour';

  if v_recent_count > 10 then
    return new;
  end if;

  select decrypted_secret into v_from
  from vault.decrypted_secrets where name = 'guestbook_notify_from';

  -- Přezdívka jde do předmětu, kde nesmí být zalomení řádků.
  v_nickname := regexp_replace(btrim(new.nickname), '\s+', ' ', 'g');

  -- Jen prostý text: obsah vzkazu tak nemůže v e-mailu nic vykreslit.
  v_text := concat_ws(E'\n',
    'Do knihy návštěv přišel nový vzkaz, který čeká na schválení.',
    '',
    'Od: ' || v_nickname,
    'Hodnocení: ' || coalesce(repeat('★', new.rating) || repeat('☆', 5 - new.rating), 'bez hodnocení'),
    'Čas: ' || to_char(new.created_at at time zone 'Europe/Prague', 'DD.MM.YYYY HH24:MI'),
    '',
    btrim(new.message),
    '',
    'Schválit nebo smazat ho můžete v administraci:',
    'https://auramichaell.cz/admin.html'
  );

  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_api_key
    ),
    body := jsonb_build_object(
      'from', coalesce(nullif(btrim(v_from), ''), 'Kniha návštěv <onboarding@resend.dev>'),
      'to', v_to,
      'subject', 'Nový vzkaz v knize návštěv od ' || v_nickname,
      'text', v_text
    )
  );

  return new;
exception when others then
  -- Upozornění je jen pohodlí - kvůli chybě v něm se vzkaz nesmí ztratit.
  raise warning 'Upozornění na nový vzkaz se nepodařilo připravit: %', sqlerrm;
  return new;
end;
$$;

-- Stejně jako u rate-limitu: funkce je určená jen jako trigger, PostgREST
-- by ji jinak vystavil jako veřejně volatelné RPC.
revoke execute on function public.guestbook_notify_new_entry() from public, anon, authenticated;

drop trigger if exists guestbook_notify_trigger on public.guestbook_entries;
create trigger guestbook_notify_trigger
after insert on public.guestbook_entries
for each row execute function public.guestbook_notify_new_entry();

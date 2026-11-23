-- Přihlášení k odběru novinek (newsletter) přes Brevo.
-- Spusťte celý soubor v Supabase SQL Editoru.
--
-- Jak to funguje:
--   1. Formulář v patičce webu (JS/newsletter.js) zavolá funkci
--      newsletter_subscribe s e-mailem návštěvníka.
--   2. Funkce zkontroluje e-mail a limity proti spamu a předá adresu do Brevo
--      (brevo.com). Databáze webu e-mail neukládá, seznam odběratelů je jen
--      v Brevo. Tam se také píší a rozesílají samotné newslettery.
--   3. Brevo pošle potvrzovací e-mail (double opt-in). Do seznamu se adresa
--      přidá až po kliknutí na odkaz v něm. Brevo pak návštěvníka přesměruje
--      zpátky na web, kde se zobrazí poděkování.
--
-- Údaje z Brevo se ukládají do Supabase Vault, ne sem - tenhle soubor je
-- veřejný na GitHubu:
--
--   select vault.create_secret('xkeysib-VAS_KLIC', 'newsletter_brevo_api_key');
--   select vault.create_secret('2', 'newsletter_brevo_list_id');
--   select vault.create_secret('1', 'newsletter_brevo_doi_template_id');
--
--   - API klíč: Brevo -> SMTP & API -> API Keys (Generate a new API key).
--     Stačí omezený přístup (Restricted) s oprávněním Contacts: Read/write.
--   - ID seznamu: číslo seznamu kontaktů, do kterého se odběratelé přidají
--     (Contacts -> Lists).
--   - ID šablony: číslo šablony potvrzovacího e-mailu (Marketing ->
--     Templates, číslo "#1" pod názvem). Kód šablony je v
--     emaily/potvrzeni-odberu.html. Brevo ji jako potvrzovací pozná, jen když:
--       * je aktivní (Active),
--       * má v pokročilém nastavení štítek (Tag) optin,
--       * tlačítko v ní má jako odkaz {{ doubleoptin }}.
--
-- Dokud nejsou uložené všechny tři údaje, formulář návštěvníkovi oznámí,
-- že se odběr teprve připravuje.
--
-- Jestli Brevo požadavky přijímá, ukáže tenhle dotaz (odpovědi se drží
-- jen několik hodin):
--
--   select created, status_code, content::text, error_msg
--   from net._http_response order by created desc limit 5;
--
--   201 nebo 204 = v pořádku. 401 = špatný API klíč, nebo Brevo blokuje
--   požadavky z neznámé IP adresy (Brevo -> Security -> Authorised IPs).
--   400 = špatné ID seznamu nebo šablony; přesný důvod je v content.
--   "An active DOI template does not exist" = šablona není aktivní, nemá
--   štítek optin, nebo je ve Vault jiné ID šablony.

-- pg_net posílá HTTP požadavky na pozadí, až po skončení funkce, takže
-- formulář kvůli spojení s Brevo nečeká.
create extension if not exists pg_net with schema extensions;

-- ============================================
-- OCHRANA PROTI SPAMU: rate-limit podle IP adresy
-- ============================================
-- Bez limitu by šlo formulář zneužít k zasílání potvrzovacích e-mailů
-- na cizí adresy, a Brevo by kvůli stížnostem mohlo účet zablokovat.
-- Ukládá se jen IP adresa a čas, záznamy se mažou po 2 dnech.
create table if not exists public.newsletter_rate_limit (
  id bigint generated always as identity primary key,
  -- Prázdná, když se IP adresu nepodaří zjistit. Záznam se pak počítá
  -- aspoň do celkového limitu za hodinu.
  client_ip text,
  submitted_at timestamptz not null default now()
);

create index if not exists newsletter_rate_limit_ip_idx
  on public.newsletter_rate_limit (client_ip, submitted_at desc);

create index if not exists newsletter_rate_limit_time_idx
  on public.newsletter_rate_limit (submitted_at desc);

alter table public.newsletter_rate_limit enable row level security;
-- Žádná RLS policy pro anon/authenticated - tabulka je přístupná jen přes
-- SECURITY DEFINER funkci níže.

-- ============================================
-- PŘIHLÁŠENÍ K ODBĚRU
-- ============================================
-- Chyby určené návštěvníkovi mají kód P0001 (výchozí u RAISE EXCEPTION)
-- a JS/newsletter.js zobrazí jejich text. Jakoukoli jinou chybu nahradí
-- obecnou hláškou.
create or replace function public.newsletter_subscribe(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_ip text;
  v_api_key text;
  v_list_id bigint;
  v_template_id bigint;
begin
  -- Hrubá kontrola tvaru adresy. Jestli adresa opravdu existuje, ověří
  -- až potvrzovací e-mail.
  if length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Zadejte prosím platnou e-mailovou adresu.';
  end if;

  select nullif(btrim(decrypted_secret), '') into v_api_key
  from vault.decrypted_secrets where name = 'newsletter_brevo_api_key';

  begin
    select nullif(btrim(decrypted_secret), '')::bigint into v_list_id
    from vault.decrypted_secrets where name = 'newsletter_brevo_list_id';

    select nullif(btrim(decrypted_secret), '')::bigint into v_template_id
    from vault.decrypted_secrets where name = 'newsletter_brevo_doi_template_id';
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise warning 'ID seznamu nebo šablony Brevo ve Vault není číslo.';
    v_list_id := null;
  end;

  if v_api_key is null or v_list_id is null or v_template_id is null then
    raise exception 'Odběr novinek se teprve připravuje. Zkuste to prosím později.';
  end if;

  begin
    v_ip := coalesce(
      nullif(current_setting('request.headers', true)::json ->> 'cf-connecting-ip', ''),
      nullif(btrim(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1)), '')
    );
  exception when others then
    v_ip := null;
  end;

  if v_ip is not null then
    if (
      select count(*) from public.newsletter_rate_limit
      where client_ip = v_ip and submitted_at > now() - interval '10 minutes'
    ) >= 3 then
      raise exception 'Příliš mnoho pokusů z této adresy. Zkuste to prosím znovu za chvíli.';
    end if;

    if (
      select count(*) from public.newsletter_rate_limit
      where client_ip = v_ip and submitted_at > now() - interval '24 hours'
    ) >= 10 then
      raise exception 'Dosáhli jste denního limitu přihlášení z této adresy. Zkuste to prosím zítra.';
    end if;
  end if;

  -- Pojistka proti útoku z mnoha adres najednou, kterou limit podle IP
  -- nezachytí. Pro malý salon je 30 přihlášení za hodinu víc než dost.
  if (
    select count(*) from public.newsletter_rate_limit
    where submitted_at > now() - interval '1 hour'
  ) >= 30 then
    raise exception 'Právě se přihlašuje hodně lidí najednou. Zkuste to prosím za chvíli.';
  end if;

  insert into public.newsletter_rate_limit (client_ip) values (v_ip);
  delete from public.newsletter_rate_limit where submitted_at < now() - interval '2 days';

  -- Brevo pošle potvrzovací e-mail a po kliknutí na odkaz v něm přidá
  -- adresu do seznamu. Když adresa v seznamu už je, nic se nezdvojí.
  perform net.http_post(
    url := 'https://api.brevo.com/v3/contacts/doubleOptinConfirmation',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/json',
      'api-key', v_api_key
    ),
    body := jsonb_build_object(
      'email', v_email,
      'includeListIds', jsonb_build_array(v_list_id),
      'templateId', v_template_id,
      -- Po potvrzení: úvodní stránka s poděkováním (JS/newsletter.js).
      'redirectionUrl', 'https://auramichaell.cz/?odber=potvrzen'
    )
  );
end;
$$;

-- Funkci smí volat formulář na webu (anon). Nic jiného než přihlášení
-- k odběru neumí a vrací jen chybu nebo nic.
revoke all on function public.newsletter_subscribe(text) from public;
grant execute on function public.newsletter_subscribe(text) to anon, authenticated;

-- ============================================
-- UDRŽENÍ API KLÍČE NAŽIVU
-- ============================================
-- Brevo zneplatní API klíč, který se 90 dní nepoužil. Kdyby se tak dlouho
-- nikdo nepřihlásil, formulář by potichu přestal fungovat. Proto se databáze
-- dvakrát měsíčně (1. a 15. ve 3:17 UTC) zeptá Brevo na seznam odběratelů.
-- Nic se tím nemění, jde jen o použití klíče.
--
-- Naplánované úlohy jsou v Supabase v Integrations -> Cron, odpovědi Brevo
-- v net._http_response jako u přihlášení (200 = v pořádku).
create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.newsletter_brevo_keepalive()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_api_key text;
  v_list_id text;
begin
  select nullif(btrim(decrypted_secret), '') into v_api_key
  from vault.decrypted_secrets where name = 'newsletter_brevo_api_key';

  select btrim(decrypted_secret) into v_list_id
  from vault.decrypted_secrets where name = 'newsletter_brevo_list_id';

  if v_api_key is null or v_list_id is null or v_list_id !~ '^[0-9]+$' then
    return;
  end if;

  perform net.http_get(
    url := 'https://api.brevo.com/v3/contacts/lists/' || v_list_id,
    headers := jsonb_build_object(
      'Accept', 'application/json',
      'api-key', v_api_key
    )
  );
end;
$$;

-- Jen pro naplánovanou úlohu, ne pro web.
revoke all on function public.newsletter_brevo_keepalive() from public, anon, authenticated;

-- Úloha se stejným názvem se při opakovaném spuštění souboru jen přepíše.
select cron.schedule(
  'newsletter-brevo-keepalive',
  '17 3 1,15 * *',
  'select public.newsletter_brevo_keepalive()'
);

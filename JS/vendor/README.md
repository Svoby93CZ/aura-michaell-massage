# Knihovny třetích stran

Knihovny jsou uložené přímo na webu, ne načítané z cizího CDN. Změna
na CDN nebo podvržený balíček se tak nemůže dostat do administrace,
kde je přihlášený správce. Soubory jsou beze změny převzaté z registru npm.

| Soubor | Balíček | SHA-256 | Licence |
| --- | --- | --- | --- |
| `supabase-2.118.0.js` | `@supabase/supabase-js@2.118.0`, soubor `dist/umd/supabase.js` | `ee3be8de192b97cb1d73d1e95d6b82bb1f6b658c0f97c4ef757fc331996ed3d3` | MIT, `LICENSE-supabase-js.txt` |
| `three-0.128.0.min.js` | `three@0.128.0`, soubor `build/three.min.js` | `9274bbcec8d96168626c732b5d31c775aa8cfb7eaa0599bec0c175908a2c1ce2` | MIT, `LICENSE-three.txt` |

Verze je v názvu souboru schválně. Knihovny se načítají i přímo ze skriptů
(`JS/supabase-config.js`, `JS/card-3d.js`), kam `tools/stamp_assets.py`
značku verze nedoplní, a `.htaccess` nechává JS v cache až měsíc.

## Aktualizace

Novou verzi je dobré brát až pár týdnů po vydání, kdy by se případný
podvržený balíček stihl odhalit.

```bash
npm pack @supabase/supabase-js@<verze>
tar -xzf supabase-supabase-js-<verze>.tgz
cp package/dist/umd/supabase.js JS/vendor/supabase-<verze>.js
sha256sum JS/vendor/supabase-<verze>.js
```

Potom přepsat cestu v `JS/supabase-config.js` a `admin.html`, smazat starý
soubor a doplnit tabulku výše.

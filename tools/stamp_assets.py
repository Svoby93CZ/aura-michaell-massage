#!/usr/bin/env python3
"""Ozn/ac/i CSS a JS soubory verzi, aby prohlizec po zmene nacetl novou verzi.

Pouziti:
    python3 tools/stamp_assets.py

Proc to je potreba:
.htaccess nastavuje pro CSS a JS cache "access plus 1 month". Prohlizec si
tedy stary soubor drzi klidne mesic a po nasazeni zmeny nacte novou HTML
strankou stary skript - stranka pak vypada nove, ale nefunguje.

Skript proto ke kazdemu odkazu na vlastni .css a .js doplni ?v=<hash>.
Hash se pocita z obsahu souboru, takze se zmeni jen tehdy, kdyz se zmeni
soubor. Spoustejte pred kazdym nasazenim.
"""

from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Odkaz na vlastni soubor: neni absolutni ani na cizi domenu.
ASSET_PATTERN = re.compile(
    r'(?P<attr>\b(?:href|src)=")(?P<path>(?!https?://|//|/|data:)[^"?#]+\.(?:css|js))'
    r'(?P<query>\?[^"]*)?(?P<end>")'
)


def file_version(path: Path) -> str | None:
    if not path.is_file():
        return None
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return digest[:8]


def stamp(html_path: Path) -> int:
    text = html_path.read_text(encoding="utf-8")
    missing: list[str] = []
    changes = 0

    def replace(match: re.Match[str]) -> str:
        nonlocal changes
        asset_path = match.group("path")
        version = file_version(ROOT / asset_path)

        if version is None:
            missing.append(asset_path)
            return match.group(0)

        replacement = f'{match.group("attr")}{asset_path}?v={version}{match.group("end")}'
        if replacement != match.group(0):
            changes += 1
        return replacement

    updated = ASSET_PATTERN.sub(replace, text)

    for asset_path in missing:
        print(f"  ! {html_path.name}: soubor {asset_path} neexistuje", file=sys.stderr)

    if updated != text:
        html_path.write_text(updated, encoding="utf-8")

    return changes


def main() -> int:
    total = 0
    for html_path in sorted(ROOT.glob("*.html")):
        changes = stamp(html_path)
        total += changes
        if changes:
            print(f"  {html_path.name}: {changes} odkazu aktualizovano")

    print(f"Hotovo, aktualizovano {total} odkazu." if total else "Vse je aktualni.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

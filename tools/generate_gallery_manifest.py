#!/usr/bin/env python3
"""Vygeneruje JS/gallery-manifest.js se seznamem obrazku pro vyber v administraci.

Pouziti:
    python3 tools/generate_gallery_manifest.py

Apache ma v .htaccess "Options -Indexes", takze prohlizec si obsah slozky
sam zjistit neumi. Tenhle skript proto seznamy souboru zapise do statickych
promennych, ktere admin.html nacte:

    window.GALLERY_MASAZE  - galerie/masaze/*  (obrazky k jednotlivym masazim)
    window.GALLERY_PROSTOR - galerie/*         (fotky salonu na hlavni strance)

Po pridani noveho obrazku do galerie skript znovu spustte.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GALLERY = ROOT / "galerie"
TARGET = ROOT / "JS" / "gallery-manifest.js"
EXTENSIONS = {".webp", ".jpg", ".jpeg", ".png", ".avif"}

HEADER = """// Automaticky vygenerovano skriptem tools/generate_gallery_manifest.py.
// Needitujte rucne - pri pridani obrazku do galerie skript spustte znovu.
"""


def list_images(folder: Path, prefix: str) -> list[str]:
    """Obrazky primo v dane slozce, bez podslozek."""
    if not folder.is_dir():
        return []
    names = sorted(
        path.name
        for path in folder.iterdir()
        if path.is_file() and path.suffix.lower() in EXTENSIONS
    )
    return [f"{prefix}{name}" for name in names]


def main() -> int:
    masaze = list_images(GALLERY / "masaze", "galerie/masaze/")
    prostor = list_images(GALLERY, "galerie/")

    lines = [HEADER]
    for variable, paths in (("GALLERY_MASAZE", masaze), ("GALLERY_PROSTOR", prostor)):
        body = json.dumps(paths, ensure_ascii=False, indent=2)
        lines.append(f"window.{variable} = {body};\n")

    TARGET.write_text("\n".join(lines), encoding="utf-8")
    print(f"Zapsano {len(masaze)} obrazku masazi a {len(prostor)} obrazku galerie "
          f"do {TARGET.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

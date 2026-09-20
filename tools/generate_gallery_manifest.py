#!/usr/bin/env python3
"""Vygeneruje JS/gallery-manifest.js se seznamem obrazku pro vyber v administraci.

Pouziti:
    python3 tools/generate_gallery_manifest.py

Apache ma v .htaccess "Options -Indexes", takze prohlizec si obsah slozky
galerie/masaze/ sam zjistit neumi. Tenhle skript proto seznam souboru
zapise do staticke promenne, kterou admin.html nacte.

Po pridani noveho obrazku do galerie/masaze/ skript znovu spustte.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GALLERY = ROOT / "galerie" / "masaze"
TARGET = ROOT / "JS" / "gallery-manifest.js"
EXTENSIONS = {".webp", ".jpg", ".jpeg", ".png", ".avif"}

HEADER = """// Automaticky vygenerovano skriptem tools/generate_gallery_manifest.py.
// Needitujte rucne - pri pridani obrazku do galerie/masaze/ skript spustte znovu.
window.GALLERY_MASAZE = """


def main() -> int:
    files = sorted(
        path.name
        for path in GALLERY.iterdir()
        if path.is_file() and path.suffix.lower() in EXTENSIONS
    )
    paths = [f"galerie/masaze/{name}" for name in files]
    body = json.dumps(paths, ensure_ascii=False, indent=2)
    TARGET.write_text(f"{HEADER}{body};\n", encoding="utf-8")
    print(f"Zapsano {len(paths)} obrazku do {TARGET.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

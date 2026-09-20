#!/usr/bin/env python3
"""Vytahne katalog sluzeb ze statickeho msginfo.html a vygeneruje SQL seed.

Pouziti:
    python3 tools/extract_services.py > supabase-services-seed.sql

Skript je jednorazovy pomocnik pro prvotni naplneni tabulky public.services.
Po migraci je zdrojem pravdy databaze, ne HTML - skript slouzi uz jen
k obnove seedu, kdyby bylo potreba zacit znovu.
"""

from __future__ import annotations

import html
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "msginfo.html"


class CatalogParser(HTMLParser):
    """Projde msginfo.html a posbira vsechny article.svc2-card i s kategorii."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.group = None
        self.card = None
        self.cards: list[dict] = []
        self.capture = None
        self.buffer: list[str] = []
        self.order = {}

    # --- pomocne ---------------------------------------------------------
    @staticmethod
    def attr(attrs, name):
        for key, value in attrs:
            if key == name:
                return value
        return None

    def flush(self):
        text = " ".join("".join(self.buffer).split())
        self.buffer = []
        return text

    # --- HTMLParser ------------------------------------------------------
    def handle_starttag(self, tag, attrs):
        classes = (self.attr(attrs, "class") or "").split()

        if tag == "section" and "svc2-group" in classes:
            self.group = self.attr(attrs, "data-group")
            self.order.setdefault(self.group, 0)
            return

        if tag == "article" and "svc2-card" in classes:
            self.order[self.group] = self.order.get(self.group, 0) + 10
            self.card = {
                "category": self.attr(attrs, "data-category") or self.group,
                "slug": self.attr(attrs, "data-name") or "",
                "duration_minutes": int(self.attr(attrs, "data-duration") or 0),
                "recommended": self.attr(attrs, "data-recommended") == "true",
                "sort_order": self.order[self.group],
                "badge_text": None,
                "image_path": None,
                "image_alt": None,
                "name": "",
                "description": "",
                "price_czk": 0,
                "reservio_url": None,
                "_meta": [],
            }
            return

        if self.card is None:
            return

        if tag == "img":
            self.card["image_path"] = self.attr(attrs, "src")
            self.card["image_alt"] = self.attr(attrs, "alt")
        elif tag == "span" and "svc2-card__badge" in classes:
            self.capture = "badge_text"
        elif tag == "span":
            self.capture = "_meta"
        elif tag == "h4":
            self.capture = "name"
        elif tag == "p":
            self.capture = "description"
        elif tag == "a":
            self.card["reservio_url"] = self.attr(attrs, "href")
            self.capture = None

    def handle_data(self, data):
        if self.capture:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if self.card is not None and self.capture and tag in {"span", "h4", "p"}:
            value = self.flush()
            if self.capture == "_meta":
                self.card["_meta"].append(value)
            else:
                self.card[self.capture] = value
            self.capture = None
            return

        if tag == "article" and self.card is not None:
            meta = self.card.pop("_meta")
            # .svc2-meta obsahuje dve polozky: "50 min" a "800 Kč"
            for value in meta:
                digits = re.sub(r"[^\d]", "", value)
                if not digits:
                    continue
                if "min" in value.lower():
                    self.card["duration_minutes"] = int(digits)
                elif "kč" in value.lower():
                    self.card["price_czk"] = int(digits)
            self.cards.append(self.card)
            self.card = None
            return

        if tag == "section" and self.card is None:
            self.group = self.group  # skupina konci az dalsi svc2-group


def sql_literal(value) -> str:
    if value is None or value == "":
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def main() -> int:
    parser = CatalogParser()
    parser.feed(SOURCE.read_text(encoding="utf-8"))

    cards = parser.cards
    if not cards:
        print("Nenalezena zadna karta sluzby.", file=sys.stderr)
        return 1

    columns = (
        "category", "name", "slug", "description", "duration_minutes",
        "price_czk", "image_path", "image_alt", "reservio_url",
        "recommended", "badge_text", "sort_order",
    )

    out = [
        "-- Vygenerovano skriptem tools/extract_services.py z msginfo.html.",
        "-- Spustte v Supabase SQL Editoru az PO souboru supabase-services.sql.",
        f"-- Pocet sluzeb: {len(cards)}",
        "",
        "insert into public.services (" + ", ".join(columns) + ") values",
    ]

    rows = []
    for card in cards:
        values = ", ".join(sql_literal(card[column]) for column in columns)
        rows.append(f"  ({values})")
    out.append(",\n".join(rows) + ";")
    out.append("")

    print("\n".join(out))

    summary = {}
    for card in cards:
        summary[card["category"]] = summary.get(card["category"], 0) + 1
    print(f"-- Rozpad podle kategorii: {summary}", file=sys.stderr)
    print(f"-- Celkem: {len(cards)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

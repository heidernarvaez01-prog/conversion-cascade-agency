#!/usr/bin/env python3
"""Genera las imágenes Open Graph (1200x630) de los artículos: img/real/blog/og/<slug>.jpg

Uso (desde HTML/):  python scripts/make_og.py [--faltantes] [slug ...]   (sin slugs: todos)
Requiere Pillow. Fuente: Segoe UI (Windows) o, si no existe, DejaVu/Liberation (Linux; es lo que usa
la acción de GitHub). Estilo: fondo azul de marca, título grande, categoría y firma.
Con --faltantes solo genera las imágenes que aún no existen (así lo usa la acción de GitHub).
"""
import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "blog-src"
OUT = ROOT / "img" / "real" / "blog" / "og"
BLUE, PINK, WHITE, SOFT = (0, 43, 186), (247, 62, 155), (255, 255, 255), (186, 200, 245)
FUENTES_BOLD = ["C:/Windows/Fonts/segoeuib.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]
FUENTES_SEMI = ["C:/Windows/Fonts/seguisb.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"]
FONT_BOLD = next((f for f in FUENTES_BOLD if pathlib.Path(f).exists()), FUENTES_BOLD[0])
FONT_SEMI = next((f for f in FUENTES_SEMI if pathlib.Path(f).exists()), FUENTES_SEMI[0])


def wrap(draw, text, font, max_w):
    lines, cur = [], ""
    for word in text.split():
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def make(slug):
    meta = json.loads((SRC / slug / "meta.json").read_text(encoding="utf-8"))
    im = Image.new("RGB", (1200, 630), BLUE)
    d = ImageDraw.Draw(im)
    # marco tenue + motivo de barras (sin datos reales)
    for i, w in enumerate((300, 220, 150, 90)):
        d.rounded_rectangle((1128 - w, 470 + i * 34, 1128, 490 + i * 34), radius=8, fill=(38, 75, 205))
    d.rectangle((72, 88, 80, 360), fill=PINK)

    size = 74
    while True:
        font = ImageFont.truetype(FONT_BOLD, size)
        lines = wrap(d, meta["h1"], font, 980)
        if len(lines) <= 4 or size <= 52:
            break
        size -= 4
    y = 84
    for ln in lines:
        d.text((112, y), ln, font=font, fill=WHITE)
        y += int(size * 1.16)

    small = ImageFont.truetype(FONT_SEMI, 30)
    d.text((112, 540), "APACHE STUDIO", font=small, fill=WHITE)
    x = 112 + d.textlength("APACHE STUDIO", font=small) + 26
    d.ellipse((x, 556, x + 7, 563), fill=PINK)
    d.text((x + 26, 540), meta["section"], font=small, fill=SOFT)
    OUT.mkdir(parents=True, exist_ok=True)
    im.save(OUT / f"{slug}.jpg", quality=90, optimize=True, progressive=True)
    print("OG", slug, f"({len(lines)} líneas, {size}px)")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    slugs = args or json.loads((SRC / "posts.json").read_text(encoding="utf-8"))
    for s in slugs:
        if "--faltantes" in sys.argv and (OUT / f"{s}.jpg").exists():
            continue
        make(s)

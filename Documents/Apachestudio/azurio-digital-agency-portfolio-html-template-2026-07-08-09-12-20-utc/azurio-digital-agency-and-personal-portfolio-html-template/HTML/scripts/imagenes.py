#!/usr/bin/env python3
"""Biblioteca de imágenes del blog: procesa las imágenes nuevas y dice cuáles están libres.

Uso (desde HTML/):
    python scripts/imagenes.py sync [--origen RUTA]   # procesa lo nuevo de la carpeta de origen
    python scripts/imagenes.py libres                 # fotos que aún no se usan en ningún artículo
    python scripts/imagenes.py usos                   # dónde se usa cada foto (detecta repetidas)

Carpeta de origen (por defecto, la de OneDrive del proyecto):
    <origen>/Fotos de Relleno/        -> img/real/blog/photos/<nombre>.jpg   (1600x1000, ~100 KB)
    <origen>/Iconos Business/         -> img/real/blog/icons/<nombre>.webp   (320x320)
    <origen>/Iconos Redes Sociales/   -> img/real/blog/icons/<nombre>.webp

Los originales pesan de 8 a 30 MB y NUNCA se suben. El catálogo (blog-src/imagenes.json) guarda
qué archivo de origen dio cada imagen y su descripción (alt). Las fotos nuevas entran con
"alt": "" y hay que describirlas antes de usarlas (el build avisa si falta).
"""
import json
import pathlib
import re
import sys
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
CAT = ROOT / "blog-src" / "imagenes.json"
PHOTOS = ROOT / "img" / "real" / "blog" / "photos"
ICONS = ROOT / "img" / "real" / "blog" / "icons"
ORIGEN = pathlib.Path(r"C:\Users\heide\OneDrive\Documents\Paginas web\azurio-apache-preview\img\Imagenes adicionales")
EXT = (".jpg", ".jpeg", ".png")


def slug(name):
    n = unicodedata.normalize("NFKD", pathlib.Path(name).stem).encode("ascii", "ignore").decode().lower()
    n = re.sub(r"-?\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}-utc", "", n)      # sufijo de fecha del banco de imágenes
    n = re.sub(r"[^a-z0-9]+", "-", n).strip("-")
    return "-".join(n.split("-")[:6]) or "imagen"


def load():
    return json.loads(CAT.read_text(encoding="utf-8")) if CAT.exists() else {"fotos": {}, "iconos": {}}


def save(cat):
    CAT.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def usos():
    """foto -> lista de artículos donde aparece (meta hero o cuerpo)."""
    out = {}
    for d in sorted((ROOT / "blog-src").iterdir()):
        if not d.is_dir() or d.name.startswith("_"):
            continue
        text = ""
        for f in ("meta.json", "body.html"):
            p = d / f
            if p.exists():
                text += p.read_text(encoding="utf-8")
        for m in set(re.findall(r"/img/real/blog/photos/([\w.-]+)", text)):
            out.setdefault(m, []).append(d.name)
    return out


def sync(origen):
    from PIL import Image, ImageOps
    Image.MAX_IMAGE_PIXELS = None
    cat = load()
    hechos = {v["origen"] for v in cat["fotos"].values()} | {v["origen"] for v in cat["iconos"].values()}
    nuevas = 0
    for carpeta, tipo in (("Fotos de Relleno", "fotos"), ("Iconos Business", "iconos"), ("Iconos Redes Sociales", "iconos")):
        base = origen / carpeta
        if not base.is_dir():
            continue
        for f in sorted(base.iterdir()):
            rel = f"{carpeta}/{f.name}"
            if f.suffix.lower() not in EXT or rel in hechos or "Preview" in f.name:
                continue
            name = slug(f.name.replace("3D Icon", ""))
            try:
                im = Image.open(f)
                if tipo == "fotos":
                    if im.width < 1200:          # recortes pequeños y logos no sirven como foto
                        continue
                    if im.format == "JPEG":
                        im.draft("RGB", (3200, 2000))
                    im = ImageOps.exif_transpose(im).convert("RGB")
                    im = ImageOps.fit(im, (1600, 1000), Image.LANCZOS, centering=(.5, .5))
                    PHOTOS.mkdir(parents=True, exist_ok=True)
                    im.save(PHOTOS / f"{name}.jpg", quality=80, optimize=True, progressive=True)
                    cat["fotos"][name] = {"origen": rel, "alt": "", "temas": []}
                else:
                    im = im.convert("RGBA")
                    bb = im.getchannel("A").getbbox()
                    if bb:
                        im = im.crop(bb)
                    s = max(im.size)
                    lienzo = Image.new("RGBA", (s, s), (0, 0, 0, 0))
                    lienzo.paste(im, ((s - im.width) // 2, (s - im.height) // 2))
                    ICONS.mkdir(parents=True, exist_ok=True)
                    lienzo.resize((320, 320), Image.LANCZOS).save(ICONS / f"{name}.webp", quality=88, method=6)
                    cat["iconos"][name] = {"origen": rel}
                nuevas += 1
                print(f"nueva {tipo[:-1]}: {name}")
            except Exception as e:
                print("omitida", rel, e)
    save(cat)
    sin_alt = [n for n, v in cat["fotos"].items() if not v.get("alt")]
    print(f"\n{nuevas} imágenes nuevas. Fotos sin descripción (alt) en el catálogo: {len(sin_alt)}")
    for n in sin_alt:
        print("  -", n)


def libres():
    cat, u = load(), usos()
    libres_ = [n for n in cat["fotos"] if f"{n}.jpg" not in u]
    print(f"{len(libres_)} fotos libres de {len(cat['fotos'])}:")
    for n in libres_:
        print("  ", n, "" if cat["fotos"][n].get("alt") else "(sin alt)")


def mostrar_usos():
    for foto, arts in sorted(usos().items()):
        marca = "  <-- REPETIDA" if len(arts) > 1 else ""
        print(f"{foto}: {', '.join(arts)}{marca}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "libres"
    if cmd == "sync":
        o = ORIGEN
        if "--origen" in sys.argv:
            o = pathlib.Path(sys.argv[sys.argv.index("--origen") + 1])
        sync(o)
    elif cmd == "libres":
        libres()
    elif cmd == "usos":
        mostrar_usos()
    else:
        sys.exit(__doc__)

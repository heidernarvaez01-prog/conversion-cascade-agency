#!/usr/bin/env python3
"""Crea un artículo nuevo a partir de blog-src/_plantilla/ y lo agrega a posts.json.

Uso (desde HTML/):  python scripts/new_post.py <slug>
Después: edita blog-src/<slug>/meta.json y body.html, reemplaza todos los [[...]], y ejecuta
    python scripts/make_og.py <slug>
    python scripts/build_blog.py <slug>
    python scripts/build_blog.py --check
"""
import json
import pathlib
import re
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "blog-src"

if len(sys.argv) != 2 or not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", sys.argv[1]):
    sys.exit("Uso: python scripts/new_post.py <slug-en-minusculas-con-guiones>")
slug = sys.argv[1]
dest = SRC / slug
if dest.exists():
    sys.exit(f"Ya existe {dest}")
shutil.copytree(SRC / "_plantilla", dest)
meta_path = dest / "meta.json"
meta_path.write_text(meta_path.read_text(encoding="utf-8").replace("[[slug-del-articulo]]", slug), encoding="utf-8")
posts_path = SRC / "posts.json"
posts = json.loads(posts_path.read_text(encoding="utf-8"))
posts.append(slug)
posts_path.write_text(json.dumps(posts, indent=2) + "\n", encoding="utf-8")
print(f"Creado {dest}. Agregado al final de posts.json (el orden define anterior/siguiente).")
print("Recuerda agregar la URL a public/sitemap.xml (build_blog.py actualiza el lastmod).")

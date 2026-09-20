# Blog estático — cómo publicar un artículo

Las páginas `blog/<slug>/index.html` **se generan**; no se editan a mano.

```
python scripts/build_blog.py            # regenera todos (y actualiza lastmod en public/sitemap.xml)
python scripts/build_blog.py <slug>     # solo uno
python scripts/build_blog.py --check    # valida sin escribir (falla si hay avisos)
python scripts/make_og.py [slug]        # imagen Open Graph 1200x630 (Pillow + Segoe UI)
```

## Artículo nuevo

1. Crea `blog-src/<slug>/meta.json` (copia uno existente): `title` (≤ 60), `h1`, `description` (120–160),
   `keywords`, `section`, `tags`, `published`/`modified` (AAAA-MM-DD), `lead`, `hero {src, alt, caption}`,
   `related` (3 slugs), `about`, `author` (clave de `site.json`), `crumb` opcional.
2. Escribe `blog-src/<slug>/body.html` (solo el cuerpo):
   - `<p class="drop-cap">` como introducción (el índice se genera solo, antes del primer `<h2>`).
   - `<h2 id="...">` por sección, `<h3>` para subtemas. Tablas en `<div class="ed-table-wrap"><table>…`.
   - Citas: `<blockquote>Idea clave<cite>Apache Studio</cite></blockquote>`. Figuras: `<figure class="ed-fig">`.
   - FAQ: `<div class="ed-faq" id="faq"><h2>Preguntas frecuentes</h2><h3>Pregunta</h3><p>Respuesta</p>…</div>`
     → se convierte también en `FAQPage` (JSON-LD).
   - Fuentes: `<div class="ed-sources" id="fuentes"><h2>Fuentes</h2><ul><li><a href>…` → `citation` en el JSON-LD.
3. Agrega el slug a `blog-src/posts.json` (el orden define anterior/siguiente).
4. `python scripts/make_og.py <slug>` y `python scripts/build_blog.py <slug>`; agrega la URL a `public/sitemap.xml`.

Reglas de contenido: sin cifras sin fuente (enlázala en `.ed-sources`), sin casos ni clientes inventados,
español con acentos.

## Archivos compartidos

- `site.json`: marca, redes, CTA de la barra lateral y autores (foto, bio, LinkedIn).
- `_page.html`: loader, menú, footer y GTM (`@@META@@`, `@@SOCIAL@@`, `@@ARTICLE@@` son los huecos).
- `../css/editor-blog.css` y `../js/blog-article.js`: estilos (todo bajo `.ed-blog`) y comportamiento.

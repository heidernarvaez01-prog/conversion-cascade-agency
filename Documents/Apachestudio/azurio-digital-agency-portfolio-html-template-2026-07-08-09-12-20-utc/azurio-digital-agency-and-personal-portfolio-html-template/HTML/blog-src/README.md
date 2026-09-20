# Blog estático — cómo publicar un artículo

Las páginas `blog/<slug>/index.html` **se generan**; no se editan a mano.

```
python scripts/build_blog.py            # regenera todos (y actualiza lastmod en public/sitemap.xml)
python scripts/build_blog.py <slug>     # solo uno
python scripts/build_blog.py --check    # valida sin escribir (falla si hay avisos)
python scripts/make_og.py [slug]        # imagen Open Graph 1200x630 (Pillow + Segoe UI)
```

## Artículo nuevo

`python scripts/new_post.py <slug>` copia `blog-src/_plantilla/` a `blog-src/<slug>/` y agrega el slug a `posts.json`.
Reemplaza todos los `[[...]]` (el build avisa si quedan). Detalle de campos:

1. `blog-src/<slug>/meta.json`: `title` (≤ 60), `h1`, `description` (120–160),
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

## Imágenes

- Fotos y iconos 3D vienen de `OneDrive/Documents/Paginas web/azurio-apache-preview/img/Imagenes adicionales/`
  (Fotos de Relleno, Iconos Business, Iconos Redes Sociales). Los originales pesan de 8 a 30 MB: **no se suben**;
  se recortan y optimizan (fotos 1600×900 o 1200×750 en JPG ~100 KB, iconos 320×320 en WebP ~15 KB) y se guardan en
  `img/real/blog/photos/` e `img/real/blog/icons/`.
- Cada foto se usa una sola vez en todo el blog. Toda foto lleva `alt` descriptivo y caption «Foto ilustrativa».
- Componentes disponibles en el cuerpo: `figure.ed-fig.alignright|alignleft` (foto con texto envolvente),
  `div.ed-cards` (+ `.cols-4`) con `.ed-card` (icono 3D, título y texto), `div.ed-callout.has-icon` (icono a la izquierda),
  `div.ed-icon-row` (fila de iconos de plataformas) y `<pre><code>` para bloques de código.

## Imágenes nuevas (biblioteca)

`python scripts/imagenes.py sync` procesa lo nuevo de la carpeta de origen (fotos a 1600×1000 JPG ~100 KB, iconos a WebP 320 px) y lo
registra en `blog-src/imagenes.json` con `"alt": ""`: describe cada foto antes de usarla. `python scripts/imagenes.py libres` lista las
fotos sin usar y `python scripts/imagenes.py usos` detecta repetidas; `build_blog.py` avisa si una foto se usa en dos artículos o
si falta el alt.

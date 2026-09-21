#!/usr/bin/env python3
"""Genera las páginas estáticas del blog (blog/<slug>/index.html) desde blog-src/.

Uso (desde la carpeta HTML/):
    python scripts/build_blog.py            # genera todos los artículos
    python scripts/build_blog.py <slug>     # solo uno
    python scripts/build_blog.py --check    # valida sin escribir

Fuente de cada artículo:
    blog-src/<slug>/meta.json   título, descripción, keywords, fechas, imagen, relacionados...
    blog-src/<slug>/body.html   solo el cuerpo (párrafos, h2 con id, tablas, FAQ, fuentes)
Compartido:
    blog-src/site.json          marca, autores, redes, CTA
    blog-src/posts.json         orden de lectura (define anterior/siguiente)
    blog-src/_page.html         estructura de la página (loader, menú, footer, GTM)
    blog-src/_breadcrumbs.html  migas de pan del tema

Convenciones del cuerpo (ver blog-src/README.md):
    - primer <p class="drop-cap"> = introducción; el índice se genera solo antes del primer <h2>
    - cada <h2> lleva id; la FAQ es <div class="ed-faq" id="faq"> con <h3> pregunta + <p> respuesta
    - las fuentes van en <div class="ed-sources" id="fuentes"> con <ul><li><a href>
"""
import html
import json
import math
import pathlib
import re
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "blog-src"
SITE = json.loads((SRC / "site.json").read_text(encoding="utf-8"))
ORDER = json.loads((SRC / "posts.json").read_text(encoding="utf-8"))
BASE = SITE["base_url"]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
         "septiembre", "octubre", "noviembre", "diciembre"]

E = lambda s: html.escape(str(s), quote=True)
strip_tags = lambda s: html.unescape(re.sub(r"<[^>]+>", " ", s))
warnings = []


def warn(slug, msg):
    warnings.append(f"[{slug}] {msg}")


def fecha_larga(iso):
    y, m, d = map(int, iso.split("-"))
    return f"{d} {MESES[m - 1]} {y}"


def load_post(slug):
    meta = json.loads((SRC / slug / "meta.json").read_text(encoding="utf-8"))
    body = (SRC / slug / "body.html").read_text(encoding="utf-8")
    meta["body"] = body
    # Autor por temática: meta.author > site.section_authors[sección] > site.default_author
    meta.setdefault("author", SITE.get("section_authors", {}).get(meta["section"], SITE.get("default_author", "heider-narvaez")))
    return meta


POSTS = {slug: load_post(slug) for slug in ORDER}

# Uso de fotos: cada foto de img/real/blog/photos/ debe aparecer en un solo artículo.
PHOTO_USE = {}
for _slug, _p in POSTS.items():
    for _m in set(re.findall(r"/img/real/blog/photos/([\w.-]+)", _p["body"] + json.dumps(_p["hero"]))):
        PHOTO_USE.setdefault(_m, set()).add(_slug)


def img_size(path_url, fallback=(1600, 900)):
    p = ROOT / path_url.lstrip("/")
    try:
        from PIL import Image
        with Image.open(p) as im:
            return im.size
    except Exception:
        return fallback


# ---------------------------------------------------------------------------
# cuerpo: índice automático, FAQ y fuentes
# ---------------------------------------------------------------------------
def build_toc(body):
    if 'class="ed-toc"' in body:
        return body
    items = []
    for m in re.finditer(r'(?:<div[^>]*\bid="([^"]+)"[^>]*>\s*)?<h2(?:\s+id="([^"]+)")?[^>]*>(.*?)</h2>', body, re.S):
        anchor = m.group(2) or m.group(1)
        if anchor:
            items.append((anchor, re.sub(r"<[^>]+>", "", m.group(3)).strip()))
    if len(items) < 3:
        return body
    lis = "\n".join(f'    <li><a href="#{a}">{t}</a></li>' for a, t in items)
    toc = ('<nav class="ed-toc" aria-label="Contenido del artículo">\n  <p class="ed-toc__title">Contenido</p>\n'
           f"  <ol>\n{lis}\n  </ol>\n</nav>\n\n")
    i = body.find("<h2")
    # si el h2 va envuelto en un div con id (FAQ/fuentes) el índice ya quedó antes, por construcción
    return body[:i] + toc + body[i:]


def extract_faq(body):
    m = re.search(r'<div class="ed-faq"[^>]*>(.*?)\n</div>', body, re.S) or re.search(r'<div class="ed-faq"[^>]*>(.*?)</div>\s*(?=<div|\Z)', body, re.S)
    if not m:
        return []
    inner = m.group(1)
    out = []
    for q in re.finditer(r"<h3>(.*?)</h3>(.*?)(?=<h3>|\Z)", inner, re.S):
        ans = re.sub(r"\s+", " ", strip_tags(q.group(2))).strip()
        if ans:
            out.append({"@type": "Question", "name": re.sub(r"\s+", " ", strip_tags(q.group(1))).strip(),
                        "acceptedAnswer": {"@type": "Answer", "text": ans}})
    return out


def extract_sources(body):
    m = re.search(r'<div class="ed-sources"[^>]*>(.*?)</div>', body, re.S)
    return re.findall(r'href="([^"]+)"', m.group(1)) if m else []


# ---------------------------------------------------------------------------
# piezas de HTML
# ---------------------------------------------------------------------------
def nav_html(slug):
    i = ORDER.index(slug)
    prev_ = POSTS[ORDER[i - 1]] if i > 0 else None
    next_ = POSTS[ORDER[i + 1]] if i < len(ORDER) - 1 else None
    parts = []
    if prev_:
        parts.append(f'''                      <div class="nav-previous">
                        <h4>Anterior</h4>
                        <a href="/blog/{prev_['slug']}/" rel="prev"><span class="meta-nav">←</span>{E(prev_['h1'])}</a>
                      </div>''')
    if next_:
        parts.append(f'''                      <div class="nav-next">
                        <h4>Siguiente</h4>
                        <a href="/blog/{next_['slug']}/" rel="next">{E(next_['h1'])}<span class="meta-nav">→</span></a>
                      </div>''')
    if not parts:
        return ""
    return ('                    <nav class="nav-single" aria-label="Artículos anterior y siguiente">\n'
            + "\n".join(parts) + "\n                    </nav>\n")


def related_html(post):
    cards = []
    for rs in post["related"]:
        r = POSTS[rs]
        w, h = img_size(r["hero"]["src"])
        cards.append(f'''                        <a class="yarpp-thumbnail" href="/blog/{rs}/">
                          <span class="yarpp-thumbnail-default"><img src="{E(r['hero']['src'])}" width="{w}" height="{h}" loading="lazy" alt="{E(r['hero']['alt'])}"></span>
                          <span class="yarpp-thumbnail-title">{E(r['h1'])}</span>
                        </a>''')
    return "\n".join(cards)


def sidebar_reads(post):
    """Otros artículos que no están ya en 'Te puede interesar', en orden de lectura."""
    skip = {post["slug"], *post["related"]}
    rest = [s for s in ORDER if s not in skip][:3]
    lis = []
    for s in rest:
        r = POSTS[s]
        lis.append(f'''                      <li>
                        <a href="/blog/{s}/" class="tptn_link"><img src="{E(r['hero']['src'])}" width="82" height="70" loading="lazy" alt="{E(r['hero']['alt'])}"></a>
                        <span class="tptn_after_thumb"><a href="/blog/{s}/" class="tptn_link"><span class="tptn_title">{E(r['h1'])}</span></a><span class="tptn_date">{E(r['section'])}</span></span>
                      </li>''')
    return "\n".join(lis)


def sidebar_cats():
    counts = {}
    for p in POSTS.values():
        counts[p["section"]] = counts.get(p["section"], 0) + 1
    return "\n".join(
        f'                    <li class="cat-item"><a href="/blog/"><span>{E(c)}</span><span class="count">({n})</span></a></li>'
        for c, n in sorted(counts.items()))


WHATSAPP_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.4 11.4 0 0 0 2.2 17.3L1 23l5.8-1.5A11.4 11.4 0 1 0 20.5 3.5zm-8.6 17.6a9.4 9.4 0 0 1-4.8-1.3l-.3-.2-3.4.9.9-3.3-.2-.3a9.4 9.4 0 1 1 7.8 4.2zm5.2-7c-.3-.1-1.7-.8-1.9-.9s-.5-.1-.7.1-.8.9-.9 1.1-.3.2-.6.1a7.6 7.6 0 0 1-3.8-3.3c-.3-.5.3-.5.8-1.5a.6.6 0 0 0 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.4 3.4 14.5 14.5 0 0 0 5.6 4.9c2.1.9 2.9 1 3.9.8a3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.1-.3-.2-.6-.4z"/></svg>')


def render_article(post, body, minutes):
    slug = post["slug"]
    url = f"{BASE}/blog/{slug}/"
    au = SITE["authors"][post["author"]]
    q = urllib.parse.quote
    qs = lambda s: q(s, safe="")
    share = {
        "mail": f"mailto:?subject={q(post['h1'])}&body={q('Te comparto este artículo: ' + url)}",
        "linkedin": f"https://www.linkedin.com/sharing/share-offsite/?url={qs(url)}",
        "x": f"https://twitter.com/intent/tweet?text={q(post['h1'])}&url={qs(url)}",
        "facebook": f"https://www.facebook.com/sharer/sharer.php?u={qs(url)}",
        "whatsapp": f"https://wa.me/?text={q(post['h1'] + ' ' + url)}",
    }
    hero = post["hero"]
    hw, hh = img_size(hero["src"])
    cap = f"\n                    <figcaption>{E(hero['caption'])}</figcaption>" if hero.get("caption") else ""
    tags = "\n".join(f'          <a href="/blog/" rel="tag">{E(t)}</a>' for t in post["tags"])
    cta, soc = SITE["cta"], SITE["social"]
    crumb = post.get("crumb") or post["title"].split(":")[0]
    crumbs = (SRC / "_breadcrumbs.html").read_text(encoding="utf-8").replace("@@CRUMB@@", E(crumb))
    photo = f'<img src="{E(au["photo"])}" width="480" height="480" alt="{E(au["photo_alt"])}" loading="lazy">'
    photo_lg = f'<img class="author-photo--lg" src="{E(au["photo"])}" width="480" height="480" alt="{E(au["photo_alt"])}" loading="lazy">'
    li_link = (f'<a class="author-social" href="{E(au["linkedin"])}" target="_blank" rel="me noopener" '
               f'aria-label="Perfil de {E(au["name"])} en LinkedIn"><i class="pw-icon-linkedin-squared" aria-hidden="true"></i><span>LinkedIn</span></a>')

    return f'''<!-- Section - Blog Article Start -->
      <div class="mxd-section blur-section">
        <div class="mxd-container grid-l-container">

{crumbs}
          <div class="ed-blog">
            <div class="ed-layout">

              <!-- primary -->
              <div id="primary" class="content-area with-sidebar">
                <article class="hentry post blog-single">

                  <header class="entry-header">
                    <h1 class="entry-title">{E(post['h1'])}</h1>
                    <div class="entry-meta">
                      <span class="entry-date">Publicado <time datetime="{post['published']}">{fecha_larga(post['published'])}</time></span>
                      <span class="entry-updated">Actualizado <time datetime="{post['modified']}">{fecha_larga(post['modified'])}</time></span>
                      <span class="read-time">{minutes} min de lectura</span>
                      <span class="cat-links"><a href="/blog/" rel="category tag">{E(post['section'])}</a></span>
                    </div>
                    <p class="entry-lead">{E(post['lead'])}</p>
                  </header>

                  <figure class="featured-image">
                    <img src="{E(hero['src'])}" width="{hw}" height="{hh}" alt="{E(hero['alt'])}" fetchpriority="high">{cap}
                  </figure>

                  <div class="entry-content">
{body}
                    <div class="post-tags tagcloud">
{tags}
                    </div>

                    <div class="share-links">
                      <h3>Compartir</h3>
                      <div class="share-links__list">
                        <a rel="nofollow noopener" target="_blank" href="{E(share['linkedin'])}" title="Compartir en LinkedIn" aria-label="Compartir en LinkedIn"><i class="pw-icon-linkedin-squared" aria-hidden="true"></i></a>
                        <a rel="nofollow noopener" target="_blank" href="{E(share['x'])}" title="Compartir en X" aria-label="Compartir en X"><i class="pw-icon-twitter" aria-hidden="true"></i></a>
                        <a rel="nofollow noopener" target="_blank" href="{E(share['facebook'])}" title="Compartir en Facebook" aria-label="Compartir en Facebook"><i class="pw-icon-facebook" aria-hidden="true"></i></a>
                        <a rel="nofollow noopener" target="_blank" href="{E(share['whatsapp'])}" title="Compartir por WhatsApp" aria-label="Compartir por WhatsApp">{WHATSAPP_SVG}</a>
                        <a href="{E(share['mail'])}" title="Enviar por correo" aria-label="Enviar por correo"><i class="pw-icon-mail" aria-hidden="true"></i></a>
                        <button type="button" data-copy-link="{url}" title="Copiar enlace" aria-label="Copiar enlace"><i class="pw-icon-link" aria-hidden="true"></i></button>
                      </div>
                    </div>

{nav_html(slug)}
                    <aside class="about-author">
                      <h3 class="section-title">Escrito por</h3>
                      <div class="author-bio">
                        <div class="author-img">{photo}</div>
                        <div class="author-info">
                          <h4 class="author-name">{E(au['name'])}</h4>
                          <span class="author-role">{E(au['role'])}</span>
                          <p>{E(au['bio'])}</p>
                          <p>{E(au['bio2'])}</p>
                          <p class="author-links">{li_link}<a href="/nosotros/">Conoce Apache Studio</a></p>
                        </div>
                      </div>
                    </aside>

                    <div class="yarpp-related">
                      <h3>Te puede interesar</h3>
                      <div class="yarpp-thumbnails-horizontal">
{related_html(post)}
                      </div>
                    </div>

                    <div class="ed-question" id="pregunta">
                      <h3 class="section-title">Pregunta sobre este artículo</h3>
                      <p class="comment-notes">¿Algo no quedó claro o quieres aplicarlo a tu caso? Escríbenos y te respondemos por correo. Tu correo no se publica. Los campos con <span class="required">*</span> son obligatorios.</p>
                      <form id="blog-question-form" data-source="blog_question" data-context="{E(post['h1'])}">
                        <div>
                          <label for="bq-name">Nombre <span class="required">*</span></label>
                          <input id="bq-name" name="Name" type="text" autocomplete="name" required>
                        </div>
                        <div>
                          <label for="bq-email">Correo <span class="required">*</span></label>
                          <input id="bq-email" name="E-mail" type="email" autocomplete="email" required>
                        </div>
                        <div class="is-wide">
                          <label for="bq-message">Tu pregunta <span class="required">*</span></label>
                          <textarea id="bq-message" name="Message" rows="6" required></textarea>
                        </div>
                        <div class="hp-field" aria-hidden="true">
                          <label for="bq-website">No llenar este campo</label>
                          <input id="bq-website" name="website" type="text" tabindex="-1" autocomplete="off">
                        </div>
                        <div class="is-wide">
                          <button class="button" type="submit">Enviar pregunta</button>
                        </div>
                        <p class="form-status is-wide" role="status" aria-live="polite"></p>
                      </form>
                    </div>

                  </div>
                </article>
              </div>
              <!-- primary -->

              <!-- secondary -->
              <div id="secondary" class="widget-area sidebar" role="complementary">

                <aside class="widget widget_text">
                  <h3 class="widget-title">Sobre el autor</h3>
                  <div class="textwidget">
                    {photo_lg}
                    <p>{E(au['bio'])}</p>
                    <p class="author-links">{li_link}</p>
                  </div>
                </aside>

                <aside class="widget widget_text">
                  <h3 class="widget-title">Síguenos</h3>
                  <div class="textwidget">
                    <ul class="social">
                      <li><a href="{E(soc['linkedin'])}" target="_blank" rel="noopener" aria-label="LinkedIn de Apache Studio"><i class="pw-icon-linkedin-squared" aria-hidden="true"></i></a></li>
                      <li><a href="{E(soc['facebook'])}" target="_blank" rel="noopener" aria-label="Facebook de Apache Studio"><i class="pw-icon-facebook" aria-hidden="true"></i></a></li>
                      <li><a href="{E(soc['instagram'])}" target="_blank" rel="noopener" aria-label="Instagram de Apache Studio"><i class="pw-icon-instagram" aria-hidden="true"></i></a></li>
                    </ul>
                  </div>
                </aside>

                <aside class="widget widget_categories">
                  <h3 class="widget-title">Categorías</h3>
                  <ul>
{sidebar_cats()}
                  </ul>
                </aside>

                <aside class="widget widget_widget_tptn_pop">
                  <h3 class="widget-title">Lecturas recomendadas</h3>
                  <div class="tptn_posts tptn_posts_widget">
                    <ul>
{sidebar_reads(post)}
                    </ul>
                  </div>
                </aside>

                <aside class="widget widget_text">
                  <h3 class="widget-title">{E(cta['title'])}</h3>
                  <div class="ed-cta-card">
                    <p>{E(cta['text'])}</p>
                    <a class="ed-cta-card__btn" href="{E(cta['url'])}" target="_blank" rel="noopener">{E(cta['label'])}</a>
                  </div>
                </aside>

              </div>
              <!-- secondary -->

            </div>
          </div>

        </div>
      </div>
      <!-- Section - Blog Article End -->'''


def render_meta(post):
    return f'''<!-- Page Title -->
    <title>{E(post['title'])}</title>

    <!-- Meta Tags -->
    <meta name="description" content="{E(post['description'])}">
    <meta name="keywords" content="{E(post['keywords'])}">
    <meta name="author" content="{E(SITE['authors'][post['author']]['name'])}">
    <meta name="robots" content="index, follow, max-image-preview:large">'''


def render_social(post, jsonld, og_abs):
    url = f"{BASE}/blog/{post['slug']}/"
    tags = "".join(f'    <meta property="article:tag" content="{E(t)}">\n' for t in post["tags"])
    return f'''<link rel="canonical" href="{url}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="{E(SITE['name'])}">
    <meta property="og:locale" content="{SITE['locale_og']}">
    <meta property="og:title" content="{E(post['h1'])}">
    <meta property="og:description" content="{E(post['description'])}">
    <meta property="og:url" content="{url}">
    <meta property="og:image" content="{og_abs}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="{E(post['h1'])}">
    <meta property="article:published_time" content="{post['published']}">
    <meta property="article:modified_time" content="{post['modified']}">
    <meta property="article:author" content="{E(SITE['authors'][post['author']]['name'])}">
    <meta property="article:section" content="{E(post['section'])}">
{tags}    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{E(post['h1'])}">
    <meta name="twitter:description" content="{E(post['description'])}">
    <meta name="twitter:image" content="{og_abs}">
    <script type="application/ld+json">
{jsonld}
    </script>'''


def build_jsonld(post, words, faq, sources, og_abs):
    slug = post["slug"]
    url = f"{BASE}/blog/{slug}/"
    au = SITE["authors"][post["author"]]
    org_id, site_id, blog_id = f"{BASE}/#organization", f"{BASE}/#website", f"{BASE}/blog/#blog"
    person_id = f"{BASE}/#author-{post['author']}"
    hw, hh = img_size(post["hero"]["src"])
    graph = [
        {"@type": "Organization", "@id": org_id, "name": SITE["name"], "url": f"{BASE}/",
         "logo": {"@type": "ImageObject", "url": BASE + SITE["logo"]}, "sameAs": SITE["same_as"]},
        {"@type": "WebSite", "@id": site_id, "url": f"{BASE}/", "name": SITE["name"],
         "inLanguage": SITE["language"], "publisher": {"@id": org_id}},
        {"@type": "Blog", "@id": blog_id, "url": f"{BASE}/blog/", "name": SITE["blog_name"],
         "inLanguage": SITE["language"], "publisher": {"@id": org_id}, "isPartOf": {"@id": site_id}},
        {"@type": "Person", "@id": person_id, "name": au["name"], "description": au["bio"],
         "url": au["linkedin"], "sameAs": [au["linkedin"]], "image": BASE + au["photo"],
         "jobTitle": "Business Intelligence", "worksFor": {"@id": org_id}, "knowsAbout": au["knows_about"]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": f"{BASE}/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": f"{BASE}/blog/"},
            {"@type": "ListItem", "position": 3, "name": post["h1"], "item": url}]},
    ]
    article = {
        "@type": "BlogPosting", "@id": f"{url}#article", "mainEntityOfPage": {"@type": "WebPage", "@id": url},
        "headline": post["h1"], "description": post["description"], "inLanguage": SITE["language"],
        "image": [{"@type": "ImageObject", "url": og_abs, "width": 1200, "height": 630},
                  {"@type": "ImageObject", "url": BASE + post["hero"]["src"], "width": hw, "height": hh}],
        "datePublished": post["published"], "dateModified": post["modified"],
        "author": {"@id": person_id}, "publisher": {"@id": org_id}, "isPartOf": {"@id": blog_id},
        "articleSection": post["section"], "keywords": post["keywords"], "wordCount": words,
        "about": [{"@type": "Thing", "name": n} for n in post.get("about", [])],
    }
    if sources:
        article["citation"] = sources
    graph.append(article)
    if faq:
        graph.append({"@type": "FAQPage", "@id": f"{url}#faq", "mainEntity": faq})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=2)


def build(slug, write=True):
    post = POSTS[slug]
    body = build_toc(post["body"]).rstrip() + "\n"
    text = re.sub(r"<svg.*?</svg>", " ", body, flags=re.S)
    words = len(strip_tags(text).split())
    minutes = max(1, math.ceil(words / 200))
    og_rel = post.get("og") or f"/img/real/blog/og/{slug}.jpg"
    og_abs = BASE + og_rel
    if not (ROOT / og_rel.lstrip("/")).exists():
        warn(slug, f"falta la imagen OG {og_rel} (ejecuta scripts/make_og.py)")
    if not (ROOT / post["hero"]["src"].lstrip("/")).exists():
        warn(slug, f"falta la imagen destacada {post['hero']['src']}")
    if not 110 <= len(post["description"]) <= 165:
        warn(slug, f"description de {len(post['description'])} caracteres (ideal 120-160)")
    if len(post["title"]) > 62:
        warn(slug, f"title de {len(post['title'])} caracteres (ideal ≤ 60)")
    if len(post["h1"]) > 110:
        warn(slug, "h1 supera 110 caracteres (límite recomendado del headline)")
    if "[[" in body or "[[" in json.dumps(post, ensure_ascii=False):
        warn(slug, "quedan marcadores [[...]] de la plantilla sin reemplazar")
    if re.search(r"\d+\s?%", strip_tags(body)) and 'class="ed-sources"' not in body:
        warn(slug, "hay cifras con % pero no hay sección de fuentes (.ed-sources)")
    for _m, _arts in PHOTO_USE.items():
        if slug in _arts and len(_arts) > 1:
            warn(slug, f"la foto {_m} se usa también en: {', '.join(sorted(_arts - {slug}))}")
    for _tag in re.findall(r'<img[^>]*/img/real/blog/photos/[^>]*>', body):
        if not re.search(r'alt="[^"]{8,}"', _tag):
            warn(slug, "una foto del cuerpo no tiene alt descriptivo")
    if len(re.findall(r'<h2[ >]', body)) < 3:
        warn(slug, "menos de 3 h2")
    ids = re.findall(r'\bid="([^"]+)"', body)
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        warn(slug, f"ids duplicados en el cuerpo: {sorted(dup)}")
    for a in set(re.findall(r'href="#([^"]+)"', body)):
        if a not in ids:
            warn(slug, f"ancla rota #{a}")
    for r in post["related"]:
        if r not in POSTS:
            warn(slug, f"related desconocido: {r}")

    faq, sources = extract_faq(body), extract_sources(body)
    jsonld = build_jsonld(post, words, faq, sources, og_abs)
    json.loads(jsonld)  # valida
    page = (SRC / "_page.html").read_text(encoding="utf-8")
    page = page.replace("@@META@@", render_meta(post))
    page = page.replace("@@SOCIAL@@", render_social(post, jsonld, og_abs))
    page = page.replace("@@ARTICLE@@", render_article(post, body, minutes))
    opens, closes = len(re.findall(r"<div\b", page)), len(re.findall(r"</div>", page))
    if opens != closes:
        warn(slug, f"divs sin balancear: {opens} abren / {closes} cierran")
    out = ROOT / "blog" / slug / "index.html"
    if write:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(page, encoding="utf-8")
    print(f"{'OK ' if write else 'chk'} {slug}: {words} palabras, {minutes} min, {len(faq)} FAQ, {len(sources)} fuentes")
    return post


def fecha_listado(iso):
    y, m, d = map(int, iso.split("-"))
    return f"{d:02d} {MESES[m - 1].capitalize()}, {y}"


def render_listing():
    """Regenera el listado de /blog/ (una tarjeta por artículo de blog-src, más reciente primero)."""
    p = ROOT / "blog" / "index.html"
    s = p.read_text(encoding="utf-8")
    ini, fin = "<!-- LISTADO:START -->", "<!-- LISTADO:END -->"
    if ini not in s:
        warn("blog/index", "faltan los marcadores LISTADO:START/END")
        return
    orden = sorted(ORDER, key=lambda sl: (POSTS[sl]["published"], ORDER.index(sl)), reverse=True)
    tarjetas = []
    for sl in orden:
        p_ = POSTS[sl]
        au = SITE["authors"][p_["author"]]["name"]
        words = len(strip_tags(re.sub(r"<svg.*?</svg>", " ", p_["body"], flags=re.S)).split())
        tarjetas.append(f'''                <article class="mxd-post post-simple">
                  <div class="post-simple__divider top"></div>
                  <a class="post-simple__container active-cursor-image active-cursor-permanent" data-cursor-image="{E(p_['hero']['src'])}" data-cursor-text="Leer artículo" href="/blog/{sl}/">
                    <div class="container-fluid px-0 post-simple__inner">
                      <div class="row gx-0">
                        <div class="col-12">
                          <div class="post-simple__meta">
                            <span class="meta-tag comma-tag">{E(p_['section'])}</span>
                            <span class="meta-time">{max(1, math.ceil(words / 200))} min</span>
                          </div>
                        </div>
                        <div class="col-12 col-xxl-7">
                          <div class="post-simple__title">
                            <h3>{E(p_['h1'])}</h3>
                            <div class="post-simple__data">
                              <span class="meta-author comma-tag">{E(au)}</span>
                              <span class="meta-date">{fecha_listado(p_['published'])}</span>
                            </div>
                          </div>
                        </div>
                        <div class="col-12 col-xxl-5">
                          <div class="post-simple__excerpt">
                            <p class="t-medium">{E(p_['lead'])}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                  <div class="post-simple__divider bottom"></div>
                </article>''')
    nuevo = ini + "\n" + "\n".join(tarjetas) + "\n                " + fin
    s = re.sub(re.escape(ini) + ".*?" + re.escape(fin), lambda m: nuevo, s, flags=re.S)
    s = re.sub(r'(<h1 class="large">Blog<sup>)\(\d+\)(</sup>)', lambda m: f"{m.group(1)}({len(orden)}){m.group(2)}", s)
    p.write_text(s, encoding="utf-8")
    print(f"listado de /blog/: {len(orden)} tarjetas")


def update_sitemap():
    p = ROOT / "public" / "sitemap.xml"
    if not p.exists():
        return
    s = p.read_text(encoding="utf-8")
    for slug, post in POSTS.items():
        loc = f"<loc>{BASE}/blog/{slug}/</loc>"
        if loc not in s:
            entry = ("  <url>\n    " + loc + "\n    <lastmod>" + post["modified"] + "</lastmod>\n"
                     "    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n")
            s = s.replace("</urlset>", entry + "</urlset>", 1)
            continue
        pat = re.compile(re.escape(loc) + r"(\s*<lastmod>[^<]*</lastmod>)?")
        s = pat.sub(lambda m: loc + f"\n    <lastmod>{post['modified']}</lastmod>", s, count=1)
    p.write_text(s, encoding="utf-8", newline="")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check = "--check" in sys.argv
    targets = args or ORDER
    for s in targets:
        build(s, write=not check)
    if not check and not args:
        update_sitemap()
        render_listing()
    if warnings:
        print("\nAVISOS:")
        print("\n".join("  - " + w for w in warnings))
        sys.exit(1 if check else 0)

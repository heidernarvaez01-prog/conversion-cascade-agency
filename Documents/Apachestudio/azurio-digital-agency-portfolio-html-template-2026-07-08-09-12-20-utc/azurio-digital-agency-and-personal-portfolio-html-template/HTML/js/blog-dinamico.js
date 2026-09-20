/* Blog dinamico - articulos publicados desde Lovable Cloud (tabla `articulos`) */
(function () {
  'use strict';

  var API = 'https://thacqstjbzgddhezgdfo.supabase.co/rest/v1/articulos';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoYWNxc3RqYnpnZGRoZXpnZGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2MzcwNTMsImV4cCI6MjA4MTIxMzA1M30.fJogbKxVFfGsOJmKu96tmpWYjSvSE7NSKsa5GkvtC18';

  // Portadas por tematica: se elige segun palabras clave del titulo/resumen
  var TEMAS = [
    { img: '/img/real/blog/cover-social.jpg', claves: ['instagram', 'tiktok', 'social', 'creador', 'influencer', 'reels', 'facebook', 'linkedin', 'youtube', 'contenido', 'redes'] },
    { img: '/img/real/blog/cover-ia.jpg', claves: [' ia ', 'inteligencia artificial', 'chatgpt', 'openai', 'gemini', 'claude', 'automatiz', 'algoritmo', 'machine learning', 'bot'] },
    { img: '/img/real/blog/cover-negocios.jpg', claves: ['accion', 'trading', 'financ', 'inversi', 'mercado', 'ingreso', 'monetiz', 'ventas', 'ecommerce', 'precio'] },
    { img: '/img/real/blog/cover-marketing.jpg', claves: ['marketing', 'campana', 'campaña', 'anuncio', 'ads', 'seo', 'funnel', 'lead', 'conversion', 'roas', 'dashboard', 'analitica', 'analítica'] }
  ];

  // Pool de imagenes del sitio para complementar articulos sin imagen propia
  var POOL = [
    '/img/real/blog/dashboard-marketing-pillar.png',
    '/img/real/blog/marketing-kpi-dashboard.png',
    '/img/real/blog/data-marketing-dashboard.png',
    '/img/real/blog/workflows-marketing.png',
    '/img/real/blog/chatbots-marketing.png',
    '/img/real/blog/ia-de-google.jpg',
    '/img/real/blog/server-side-tracking.png',
    '/img/real/blog/dashboard-ejemplos.png',
    '/img/real/blog/automatizar-email.png',
    '/img/real/blog/data-marketing-historia.png',
    '/img/real/blog/configurar-gtm.png',
    '/img/real/blog/dashboard-efectivo-metricas.png'
  ];

  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
    'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  function hash(s) {
    var h = 0, i;
    for (i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return h;
  }

  // Portada de cada nota = la foto de su artículo completo (blog-src)
  var HEROES = {
      "automatizar-reportes-marketing-260919": "/img/real/blog/photos/hero-reportes-automaticos.jpg",
      "decision-judicial-csam-marketing-digital": "/img/real/blog/photos/hero-ia-contenido-menores.jpg",
      "pinterest-nvidia-alianza-potenciar-descubrimiento-ai": "/img/real/blog/photos/hero-pinterest-tablero.jpg",
      "nuevas-herramientas-creacion-gafas-ia-meta": "/img/real/blog/photos/hero-gafas-ia-ciudad.jpg",
      "meta-nuevo-dispositivo-realidad-virtual": "/img/real/blog/photos/hero-visor-realidad-mixta.jpg",
      "threads-meta-superar-x": "/img/real/blog/photos/hero-threads-x-interacciones.jpg",
      "influencia-youtube-cultura-popular": "/img/real/blog/photos/hero-youtube-experiencias-compartidas.jpg",
      "mejoras-plataforma-data-manager-google": "/img/real/blog/photos/hero-google-data-manager.jpg",
      "tiktok-celebra-mes-herencia-hispana": "/img/real/blog/photos/hero-tiktok-creadores.jpg",
      "x-incorpora-trading-acciones": "/img/real/blog/photos/hero-x-cashtags.jpg",
      "x-incorpora-comercio-acciones": "/img/real/blog/photos/hero-x-cashtags.jpg",
      "colaboraciones-creadores-instagram": "/img/real/blog/photos/hero-instagram-colaboraciones.jpg",
      "colaboraciones-creadores-instagram-260919": "/img/real/blog/photos/hero-instagram-colaboraciones.jpg",
      "facebook-pages-limita-publicaciones-enlaces": "/img/real/blog/photos/hero-facebook-enlaces.jpg",
      "mejora-atencion-clientes-whatsapp": "/img/real/blog/photos/hero-whatsapp-agente-ia.jpg",
      "facilita-atencion-cliente-ia-whatsapp": "/img/real/blog/photos/hero-whatsapp-agente-ia.jpg",
      "mejorar-segmentacion-empresa-linkedin-260919": "/img/real/blog/photos/hero-linkedin-b2b.jpg",
      "guia-planificacion-festividades-2026-meta-260919": "/img/real/blog/photos/hero-festividades-compras.jpg",
      "guia-reddit-planificacion-ventas-260919": "/img/real/blog/photos/hero-reddit-festividades.jpg"
  };

  function imagenDe(a) {
    var img = (a.imagen_portada || '').trim();
    if (img) return img;
    if (HEROES[a.slug]) return HEROES[a.slug];
    var txt = (' ' + (a.titulo || '') + ' ' + (a.resumen || '') + ' ' + (a.slug || '') + ' ').toLowerCase();
    for (var i = 0; i < TEMAS.length; i++) {
      for (var j = 0; j < TEMAS[i].claves.length; j++) {
        if (txt.indexOf(TEMAS[i].claves[j]) !== -1) return TEMAS[i].img;
      }
    }
    return POOL[hash(a.slug || a.titulo || '') % POOL.length];
  }

  function fecha(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return ('0' + d.getDate()).slice(-2) + ' ' + MESES[d.getMonth()] + ', ' + d.getFullYear();
  }

  function lectura(html) {
    var txt = (html || '').replace(/<[^>]*>/g, ' ');
    var palabras = txt.split(/\s+/).filter(Boolean).length;
    return Math.max(2, Math.round(palabras / 220)) + ' min';
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pedir(qs) {
    return fetch(API + qs, {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
  }

  /* ---------- Listado /blog/ ---------- */
  function pintarListado() {
    var lista = document.querySelector('.mxd-posts-list');
    if (!lista) return;

    pedir('?select=titulo,slug,resumen,imagen_portada,fecha_publicacion,contenido&estado=eq.publicado&order=fecha_publicacion.desc&limit=50')
      .then(function (arts) {
        if (!arts.length) return;
        var frag = document.createDocumentFragment();
        arts.forEach(function (a) {
          var art = document.createElement('article');
          art.className = 'mxd-post post-simple';
          art.innerHTML =
            '<div class="post-simple__divider top"></div>' +
            '<a class="post-simple__container active-cursor-image active-cursor-permanent" data-cursor-image="' + esc(imagenDe(a)) + '" data-cursor-text="Leer Articulo" href="/blog/articulo/?slug=' + encodeURIComponent(a.slug) + '">' +
              '<div class="container-fluid px-0 post-simple__inner">' +
                '<div class="row gx-0">' +
                  '<div class="col-12"><div class="post-simple__meta">' +
                    '<span class="meta-tag comma-tag">Insights</span>' +
                    '<span class="meta-time">' + esc(lectura(a.contenido)) + '</span>' +
                  '</div></div>' +
                  '<div class="col-12 col-xxl-7"><div class="post-simple__title">' +
                    '<h3>' + esc(a.titulo) + '</h3>' +
                    '<div class="post-simple__data">' +
                      '<span class="meta-author comma-tag">Equipo Apache Studio</span>' +
                      '<span class="meta-date">' + esc(fecha(a.fecha_publicacion)) + '</span>' +
                    '</div>' +
                  '</div></div>' +
                  '<div class="col-12 col-xxl-5"><div class="post-simple__excerpt">' +
                    '<p class="t-medium">' + esc(a.resumen || '') + '</p>' +
                  '</div></div>' +
                '</div>' +
              '</div>' +
            '</a>' +
            '<div class="post-simple__divider bottom"></div>';
          frag.appendChild(art);
        });
        lista.insertBefore(frag, lista.firstChild);
      });
  }

  /* ---------- Detalle /blog/articulo/?slug= (mismo diseño que los artículos de blog-src) ---------- */
  var BASE = 'https://apachestudio.mx';

  var AUTOR = {
    nombre: 'Heider Narváez',
    rol: 'Business Intelligence · Analítica de marketing',
    bio: 'Máster en Business Intelligence con más de 6 años de experiencia en recolección, consolidación, validación (QA) y automatización de reportería para campañas de marketing digital multicanal.',
    linkedin: 'https://www.linkedin.com/in/heider-narvaez',
    foto: '/img/real/blog/authors/heider-narvaez.jpg'
  };
  var CTA = {
    titulo: '¿Hablamos de tu medición?',
    texto: 'Revisamos tu medición y te decimos qué falta antes de invertir más en campañas o dashboards.',
    boton: 'Agendar llamada',
    url: 'https://tidycal.com/m4ggodn/estrategia-marketing-cultura-ai-driven-1g6vvq0'
  };

  function fechaLarga(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getDate() + ' ' + MESES[d.getMonth()].toLowerCase() + ' ' + d.getFullYear();
  }

  /* Enlace «Análisis completo» que agrega el flujo al final de la nota (bloque .articulo-completo). */
  function enlaceCompleto(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    var a = tmp.querySelector('.articulo-completo a');
    return a ? { href: a.getAttribute('href'), texto: a.textContent.replace(/\s*→\s*$/, '') } : null;
  }

  function tarjetas(lista) {
    return lista.map(function (n) {
      return '<a class="yarpp-thumbnail" href="/blog/articulo/?slug=' + encodeURIComponent(n.slug) + '">' +
        '<span class="yarpp-thumbnail-default"><img src="' + esc(imagenDe(n)) + '" width="1600" height="900" loading="lazy" alt=""></span>' +
        '<span class="yarpp-thumbnail-title">' + esc(n.titulo) + '</span></a>';
    }).join('');
  }

  function pintarArticulo() {
    var cont = document.querySelector('[data-art="contenido"]');
    if (!cont) return;

    var slug = new URLSearchParams(window.location.search).get('slug') || '';
    if (!slug) { window.location.replace('/blog/'); return; }

    Promise.all([
      pedir('?select=*&estado=eq.publicado&slug=eq.' + encodeURIComponent(slug) + '&limit=1'),
      pedir('?select=titulo,slug,resumen,imagen_portada,fecha_publicacion&estado=eq.publicado&order=fecha_publicacion.desc&limit=30')
    ]).then(function (r) {
      var a = r[0][0];
      if (!a) { window.location.replace('/blog/'); return; }

      var todas = r[1] || [];
      var full = enlaceCompleto(a.contenido);
      var urlNota = BASE + '/blog/articulo/?slug=' + encodeURIComponent(a.slug);
      var urlCanon = full ? (/^https?:/.test(full.href) ? full.href : BASE + full.href) : urlNota;
      var img = imagenDe(a);
      var imgAbs = /^https?:/.test(img) ? img : BASE + img;
      var descr = a.resumen || a.titulo;

      /* --- SEO: si existe el artículo completo, es la versión canónica --- */
      document.title = a.titulo + ' | Apache Studio';
      set('meta[name="description"]', 'content', descr);
      set('meta[property="og:title"]', 'content', a.titulo);
      set('meta[property="og:description"]', 'content', descr);
      set('meta[property="og:url"]', 'content', urlCanon);
      set('meta[property="og:image"]', 'content', imgAbs);
      set('meta[name="twitter:title"]', 'content', a.titulo);
      set('meta[name="twitter:description"]', 'content', descr);
      set('meta[name="twitter:image"]', 'content', imgAbs);
      set('link[rel="canonical"]', 'href', urlCanon);

      var ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org', '@type': 'BlogPosting',
        headline: a.titulo, description: descr, image: [imgAbs],
        mainEntityOfPage: { '@type': 'WebPage', '@id': urlCanon },
        inLanguage: 'es-MX', datePublished: a.fecha_publicacion, dateModified: a.fecha_publicacion,
        articleSection: 'Insights',
        author: { '@type': 'Person', name: AUTOR.nombre, url: AUTOR.linkedin, sameAs: [AUTOR.linkedin], image: BASE + AUTOR.foto },
        publisher: {
          '@type': 'Organization', name: 'Apache Studio', url: BASE + '/',
          logo: { '@type': 'ImageObject', url: BASE + '/img/favicon/icon.svg' }
        }
      });
      document.head.appendChild(ld);
      text('[data-art="breadcrumb"]', a.titulo.length > 46 ? a.titulo.slice(0, 44).replace(/\s+\S*$/, '') + '…' : a.titulo);

      /* --- navegación entre notas --- */
      var pos = -1;
      todas.forEach(function (n, i) { if (n.slug === a.slug) pos = i; });
      var otras = todas.filter(function (n) { return n.slug !== a.slug; });
      var prev = pos >= 0 ? todas[pos + 1] : null;
      var next = pos > 0 ? todas[pos - 1] : null;

      var nav = '';
      if (prev || next) {
        nav = '<nav class="nav-single" aria-label="Notas anterior y siguiente">' +
          (prev ? '<div class="nav-previous"><h4>Anterior</h4><a href="/blog/articulo/?slug=' + encodeURIComponent(prev.slug) + '" rel="prev"><span class="meta-nav">←</span>' + esc(prev.titulo) + '</a></div>' : '') +
          (next ? '<div class="nav-next"><h4>Siguiente</h4><a href="/blog/articulo/?slug=' + encodeURIComponent(next.slug) + '" rel="next">' + esc(next.titulo) + '<span class="meta-nav">→</span></a></div>' : '') +
          '</nav>';
      }

      var q = encodeURIComponent;
      var compartir = {
        li: 'https://www.linkedin.com/sharing/share-offsite/?url=' + q(urlCanon),
        x: 'https://twitter.com/intent/tweet?text=' + q(a.titulo) + '&url=' + q(urlCanon),
        fb: 'https://www.facebook.com/sharer/sharer.php?u=' + q(urlCanon),
        wa: 'https://wa.me/?text=' + q(a.titulo + ' ' + urlCanon),
        mail: 'mailto:?subject=' + q(a.titulo) + '&body=' + q('Te comparto esta nota: ' + urlCanon)
      };
      var wa = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 3.5A11.4 11.4 0 0 0 2.2 17.3L1 23l5.8-1.5A11.4 11.4 0 1 0 20.5 3.5zm-8.6 17.6a9.4 9.4 0 0 1-4.8-1.3l-.3-.2-3.4.9.9-3.3-.2-.3a9.4 9.4 0 1 1 7.8 4.2zm5.2-7c-.3-.1-1.7-.8-1.9-.9s-.5-.1-.7.1-.8.9-.9 1.1-.3.2-.6.1a7.6 7.6 0 0 1-3.8-3.3c-.3-.5.3-.5.8-1.5a.6.6 0 0 0 0-.5l-.9-2.1c-.2-.5-.5-.4-.7-.4h-.6a1.2 1.2 0 0 0-.9.4 3.7 3.7 0 0 0-1.1 2.7 6.4 6.4 0 0 0 1.4 3.4 14.5 14.5 0 0 0 5.6 4.9c2.1.9 2.9 1 3.9.8a3.3 3.3 0 0 0 2.2-1.5 2.7 2.7 0 0 0 .2-1.5c-.1-.1-.3-.2-.6-.4z"/></svg>';

      var boton = full
        ? '<p class="ed-fullcta"><a href="' + esc(full.href) + '">Leer el análisis completo <span aria-hidden="true">→</span></a></p>'
        : '';

      var html =
        '<div class="ed-layout">' +
        '<div id="primary" class="content-area with-sidebar"><article class="hentry post blog-single">' +
          '<header class="entry-header">' +
            '<h1 class="entry-title">' + esc(a.titulo) + '</h1>' +
            '<div class="entry-meta">' +
              '<span class="entry-date">Publicado <time datetime="' + esc(a.fecha_publicacion) + '">' + esc(fechaLarga(a.fecha_publicacion)) + '</time></span>' +
              '<span class="read-time">' + esc(lectura(a.contenido)) + ' de lectura</span>' +
              '<span class="cat-links"><a href="/blog/" rel="category tag">Insights</a></span>' +
            '</div>' +
            (a.resumen ? '<p class="entry-lead">' + esc(a.resumen) + '</p>' : '') +
            boton +
          '</header>' +
          '<figure class="featured-image"><img src="' + esc(img) + '" width="1600" height="900" alt="' + esc(a.titulo) + '" fetchpriority="high"></figure>' +
          '<div class="entry-content">' + a.contenido +
            '<div class="post-tags tagcloud"><a href="/blog/" rel="tag">Insights</a></div>' +
            '<div class="share-links"><h3>Compartir</h3><div class="share-links__list">' +
              '<a rel="nofollow noopener" target="_blank" href="' + esc(compartir.li) + '" title="Compartir en LinkedIn" aria-label="Compartir en LinkedIn"><i class="pw-icon-linkedin-squared" aria-hidden="true"></i></a>' +
              '<a rel="nofollow noopener" target="_blank" href="' + esc(compartir.x) + '" title="Compartir en X" aria-label="Compartir en X"><i class="pw-icon-twitter" aria-hidden="true"></i></a>' +
              '<a rel="nofollow noopener" target="_blank" href="' + esc(compartir.fb) + '" title="Compartir en Facebook" aria-label="Compartir en Facebook"><i class="pw-icon-facebook" aria-hidden="true"></i></a>' +
              '<a rel="nofollow noopener" target="_blank" href="' + esc(compartir.wa) + '" title="Compartir por WhatsApp" aria-label="Compartir por WhatsApp">' + wa + '</a>' +
              '<a href="' + esc(compartir.mail) + '" title="Enviar por correo" aria-label="Enviar por correo"><i class="pw-icon-mail" aria-hidden="true"></i></a>' +
              '<button type="button" data-copy-link="' + esc(urlCanon) + '" title="Copiar enlace" aria-label="Copiar enlace"><i class="pw-icon-link" aria-hidden="true"></i></button>' +
            '</div></div>' +
            nav +
            '<aside class="about-author"><h3 class="section-title">Escrito por</h3><div class="author-bio">' +
              '<div class="author-img"><img src="' + esc(AUTOR.foto) + '" width="480" height="480" alt="Retrato en blanco y negro de ' + esc(AUTOR.nombre) + '" loading="lazy"></div>' +
              '<div class="author-info"><h4 class="author-name">' + esc(AUTOR.nombre) + '</h4><span class="author-role">' + esc(AUTOR.rol) + '</span>' +
                '<p>' + esc(AUTOR.bio) + '</p>' +
                '<p class="author-links"><a class="author-social" href="' + esc(AUTOR.linkedin) + '" target="_blank" rel="me noopener" aria-label="Perfil de ' + esc(AUTOR.nombre) + ' en LinkedIn"><i class="pw-icon-linkedin-squared" aria-hidden="true"></i><span>LinkedIn</span></a><a href="/nosotros/">Conoce Apache Studio</a></p>' +
              '</div></div></aside>' +
            (otras.length ? '<div class="yarpp-related"><h3>Te puede interesar</h3><div class="yarpp-thumbnails-horizontal">' + tarjetas(otras.slice(0, 3)) + '</div></div>' : '') +
            '<div class="ed-question" id="pregunta"><h3 class="section-title">Pregunta sobre esta nota</h3>' +
              '<p class="comment-notes">¿Algo no quedó claro o quieres aplicarlo a tu caso? Escríbenos y te respondemos por correo. Tu correo no se publica. Los campos con <span class="required">*</span> son obligatorios.</p>' +
              '<form id="blog-question-form" data-source="blog_question" data-context="' + esc(a.titulo) + '">' +
                '<div><label for="bq-name">Nombre <span class="required">*</span></label><input id="bq-name" name="Name" type="text" autocomplete="name" required></div>' +
                '<div><label for="bq-email">Correo <span class="required">*</span></label><input id="bq-email" name="E-mail" type="email" autocomplete="email" required></div>' +
                '<div class="is-wide"><label for="bq-message">Tu pregunta <span class="required">*</span></label><textarea id="bq-message" name="Message" rows="6" required></textarea></div>' +
                '<div class="hp-field" aria-hidden="true"><label for="bq-website">No llenar este campo</label><input id="bq-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
                '<div class="is-wide"><button class="button" type="submit">Enviar pregunta</button></div>' +
                '<p class="form-status is-wide" role="status" aria-live="polite"></p>' +
              '</form></div>' +
          '</div>' +
        '</article></div>' +
        '<div id="secondary" class="widget-area sidebar" role="complementary">' +
          '<aside class="widget widget_text"><h3 class="widget-title">Sobre el autor</h3><div class="textwidget">' +
            '<img class="author-photo--lg" src="' + esc(AUTOR.foto) + '" width="480" height="480" alt="Retrato en blanco y negro de ' + esc(AUTOR.nombre) + '" loading="lazy">' +
            '<p>' + esc(AUTOR.bio) + '</p>' +
            '<p class="author-links"><a class="author-social" href="' + esc(AUTOR.linkedin) + '" target="_blank" rel="me noopener" aria-label="Perfil de ' + esc(AUTOR.nombre) + ' en LinkedIn"><i class="pw-icon-linkedin-squared" aria-hidden="true"></i><span>LinkedIn</span></a></p>' +
          '</div></aside>' +
          '<aside class="widget widget_text"><h3 class="widget-title">Síguenos</h3><div class="textwidget"><ul class="social">' +
            '<li><a href="https://www.linkedin.com/company/118984525/" target="_blank" rel="noopener" aria-label="LinkedIn de Apache Studio"><i class="pw-icon-linkedin-squared" aria-hidden="true"></i></a></li>' +
            '<li><a href="https://www.facebook.com/profile.php?id=61584792540737" target="_blank" rel="noopener" aria-label="Facebook de Apache Studio"><i class="pw-icon-facebook" aria-hidden="true"></i></a></li>' +
            '<li><a href="https://www.instagram.com/apachestudio.mx/" target="_blank" rel="noopener" aria-label="Instagram de Apache Studio"><i class="pw-icon-instagram" aria-hidden="true"></i></a></li>' +
          '</ul></div></aside>' +
          (otras.length > 3 ? '<aside class="widget widget_widget_tptn_pop"><h3 class="widget-title">Más notas</h3><div class="tptn_posts tptn_posts_widget"><ul>' +
            otras.slice(3, 6).map(function (n) {
              return '<li><a href="/blog/articulo/?slug=' + encodeURIComponent(n.slug) + '" class="tptn_link"><img src="' + esc(imagenDe(n)) + '" width="82" height="70" loading="lazy" alt=""></a>' +
                '<span class="tptn_after_thumb"><a href="/blog/articulo/?slug=' + encodeURIComponent(n.slug) + '" class="tptn_link"><span class="tptn_title">' + esc(n.titulo) + '</span></a><span class="tptn_date">' + esc(fechaLarga(n.fecha_publicacion)) + '</span></span></li>';
            }).join('') + '</ul></div></aside>' : '') +
          '<aside class="widget widget_text"><h3 class="widget-title">' + esc(CTA.titulo) + '</h3><div class="ed-cta-card"><p>' + esc(CTA.texto) + '</p>' +
            '<a class="ed-cta-card__btn" href="' + esc(CTA.url) + '" target="_blank" rel="noopener">' + esc(CTA.boton) + '</a></div></aside>' +
        '</div></div>';

      cont.innerHTML = html;
      cont.querySelectorAll('.entry-content img').forEach(function (i) { i.loading = 'lazy'; });
    });
  }

  function set(sel, attr, val) {
    var el = document.querySelector(sel);
    if (el) el.setAttribute(attr, val);
  }
  function text(sel, val) {
    var el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  function init() { pintarListado(); pintarArticulo(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

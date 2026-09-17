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

  function imagenDe(a) {
    var img = (a.imagen_portada || '').trim();
    if (img) return img;
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

  /* ---------- Detalle /blog/articulo/?slug= ---------- */
  function pintarArticulo() {
    var cont = document.querySelector('[data-art="contenido"]');
    if (!cont) return;

    var slug = new URLSearchParams(window.location.search).get('slug') || '';
    if (!slug) { window.location.replace('/blog/'); return; }

    pedir('?select=*&estado=eq.publicado&slug=eq.' + encodeURIComponent(slug) + '&limit=1')
      .then(function (arts) {
        var a = arts[0];
        if (!a) { window.location.replace('/blog/'); return; }

        var url = 'https://apachestudio.mx/blog/articulo/?slug=' + encodeURIComponent(a.slug);
        var img = imagenDe(a);
        var imgAbs = /^https?:/.test(img) ? img : 'https://apachestudio.mx' + img;

        document.title = a.titulo + ' | Apache Studio';
        set('meta[name="description"]', 'content', a.resumen || a.titulo);
        set('meta[property="og:title"]', 'content', a.titulo);
        set('meta[property="og:description"]', 'content', a.resumen || a.titulo);
        set('meta[property="og:url"]', 'content', url);
        set('meta[property="og:image"]', 'content', imgAbs);
        set('meta[name="twitter:title"]', 'content', a.titulo);
        set('meta[name="twitter:description"]', 'content', a.resumen || a.titulo);
        set('meta[name="twitter:image"]', 'content', imgAbs);
        set('link[rel="canonical"]', 'href', url);

        var ld = document.createElement('script');
        ld.type = 'application/ld+json';
        ld.textContent = JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Article',
          headline: a.titulo, description: a.resumen || '', image: [imgAbs],
          url: url, inLanguage: 'es', datePublished: a.fecha_publicacion,
          author: { '@type': 'Organization', name: 'Apache Studio' },
          publisher: {
            '@type': 'Organization', name: 'Apache Studio',
            logo: { '@type': 'ImageObject', url: 'https://apachestudio.mx/img/favicon/icon.svg' }
          }
        });
        document.head.appendChild(ld);

        text('[data-art="titulo"]', a.titulo);
        text('[data-art="breadcrumb"]', a.titulo);

        var meta = document.querySelector('[data-art="meta"]');
        if (meta) {
          meta.innerHTML =
            '<span class="tag tag-m meta-tag slash-tag">' + esc(fecha(a.fecha_publicacion)) + '</span>' +
            '<span class="tag tag-m meta-tag">' + esc(lectura(a.contenido)) + ' de lectura</span>';
        }

        var tags = document.querySelector('[data-art="tags"]');
        if (tags) {
          tags.innerHTML = '<a href="/blog/"><span class="tag tag-m meta-tag">Insights</span></a>';
        }

        var thumb = document.querySelector('[data-art="imagen"]');
        if (thumb) { thumb.src = img; thumb.alt = a.titulo; }

        var bloque = document.createElement('div');
        bloque.className = 'mxd-article__block';
        bloque.innerHTML = (a.resumen ? '<p class="mxd-article__excerpt">' + esc(a.resumen) + '</p>' : '') + a.contenido;
        bloque.querySelectorAll('p').forEach(function (p) {
          if (!p.className) p.className = 'mxd-article__normal';
        });
        bloque.querySelectorAll('img').forEach(function (i) {
          i.loading = 'lazy';
          i.style.maxWidth = '100%';
          i.style.height = 'auto';
        });
        cont.innerHTML = '';
        cont.appendChild(bloque);
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

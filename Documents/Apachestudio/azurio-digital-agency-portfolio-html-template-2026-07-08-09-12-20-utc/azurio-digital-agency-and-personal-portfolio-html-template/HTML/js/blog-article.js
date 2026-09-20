/* Apache Studio - comportamiento de la página de artículo (layout "ed-blog").
 * Vanilla JS, sin dependencias: copiar enlace (funciona también con contenido cargado después,
 * como las notas dinámicas) y resaltar el índice al hacer scroll. */
(function () {
  "use strict";

  /* ---- Copiar enlace (delegado: sirve para contenido que se pinta tras cargar la página) ---- */
  document.addEventListener("click", function (ev) {
    var copyBtn = ev.target.closest ? ev.target.closest("[data-copy-link]") : null;
    if (!copyBtn) return;
    var url = copyBtn.getAttribute("data-copy-link") || window.location.href;
    var done = function () {
      copyBtn.classList.add("is-copied");
      copyBtn.setAttribute("aria-label", "Enlace copiado");
      setTimeout(function () {
        copyBtn.classList.remove("is-copied");
        copyBtn.setAttribute("aria-label", "Copiar enlace");
      }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(function () {});
    } else {
      var ta = document.createElement("textarea");
      ta.value = url;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  });

  /* ---- Índice: resalta la sección visible (solo artículos estáticos con índice) ---- */
  var root = document.querySelector(".ed-blog");
  if (!root) return;
  var links = Array.prototype.slice.call(root.querySelectorAll(".ed-toc a[href^='#']"));
  if (links.length && "IntersectionObserver" in window) {
    var map = {};
    var targets = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (el) { map[id] = a; targets.push(el); }
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); });
        var a = map[entry.target.id];
        if (a) a.classList.add("is-active");
      });
    }, { rootMargin: "-20% 0px -70% 0px", threshold: 0 });
    targets.forEach(function (t) { io.observe(t); });
  }
})();

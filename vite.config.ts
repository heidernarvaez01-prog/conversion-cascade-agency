import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEMPLATE_ROOT =
  "Documents/Apachestudio/azurio-digital-agency-portfolio-html-template-2026-07-08-09-12-20-utc/azurio-digital-agency-and-personal-portfolio-html-template/HTML";

const templateDir = path.resolve(__dirname, TEMPLATE_ROOT);

// Every real .html page in the template must be listed here as its own
// build entry. Vite defaults to treating `root`'s index.html as the ONLY
// page when no rollupOptions.input is given -- without this list, the
// production build only ever contains index.html, and every other route
// (contact.html, index-design-studio.html, etc.) 404s and falls back to
// the homepage on the live site.
const pages = [
  "404.html",
  "index.html",
  "servicios/index.html",
  "servicios/campanas-digitales/index.html",
  "servicios/seo-growth/index.html",
  "servicios/desarrollo-web/index.html",
  "servicios/implementacion-tecnica/index.html",
  "servicios/dashboards-y-reportes/index.html",
  "servicios/apache-360/index.html",
  "servicios/social-media/index.html",
  "servicios/ecosistema-digital/index.html",
  "servicios/mantenimiento-web/index.html",
  "casos-de-exito/index.html",
  "casos-de-exito/oxxo/index.html",
  "planes/index.html",
  "nosotros/index.html",
  "nuestra-historia/index.html",
  "equipo/index.html",
  "preguntas-frecuentes/index.html",
  "contacto/index.html",
  "blog/index.html",
  "blog/que-es-apache-360/index.html",
  "blog/analitica-de-marketing-digital/index.html",
  "blog/ai-en-marketing-digital/index.html",
  "blog/automatizacion-de-marketing/index.html",
  "blog/dashboard-de-marketing-digital/index.html",
  "blog/implementacion-tecnica/index.html",
  "blog/performance-marketing/index.html",
];

export default defineConfig({
  root: TEMPLATE_ROOT,
  server: { host: "::", port: 8080 },
  build: {
    outDir: "../../../../../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [
          page.replace(/\/?index\.html$/, "") || "index",
          path.resolve(templateDir, page),
        ])
      ),
    },
  },
});

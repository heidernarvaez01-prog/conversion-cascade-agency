import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

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

// Static folders referenced with absolute paths (/img/..., /css/...) in the
// HTML. Vite does not process those, so they must be copied into dist or the
// published site loses every image, video, stylesheet and script.
const STATIC_DIRS = ["css", "js", "img", "video", "fonts"];

function copyStaticDirs(outDir: string) {
  return {
    name: "copy-template-static-dirs",
    apply: "build" as const,
    closeBundle() {
      for (const dir of STATIC_DIRS) {
        const from = path.resolve(templateDir, dir);
        if (!fs.existsSync(from)) continue;
        fs.cpSync(from, path.resolve(outDir, dir), { recursive: true });
      }
      const htaccess = path.resolve(templateDir, ".htaccess");
      if (fs.existsSync(htaccess)) {
        fs.copyFileSync(htaccess, path.resolve(outDir, ".htaccess"));
      }
    },
  };
}

const OUT_DIR = path.resolve(__dirname, "dist");

export default defineConfig({
  plugins: [copyStaticDirs(OUT_DIR)],
  root: TEMPLATE_ROOT,
  server: { host: "::", port: 8080 },
  build: {
    outDir: OUT_DIR,
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

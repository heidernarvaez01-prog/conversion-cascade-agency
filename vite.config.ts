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
  "about-me.html",
  "about-us.html",
  "blog-ai-marketing.html",
  "blog-analitica-marketing-digital.html",
  "blog-article.html",
  "blog-automatizacion-marketing.html",
  "blog-creative.html",
  "blog-dashboard-marketing-digital.html",
  "blog-implementacion-tecnica.html",
  "blog-performance-marketing.html",
  "blog-standard.html",
  "contact.html",
  "faq.html",
  "index-branding-studio.html",
  "index-creative-agency.html",
  "index-design-studio.html",
  "index-digital-designer.html",
  "index-freelancer-portfolio.html",
  "index-personal-portfolio.html",
  "index-software-development-company.html",
  "index-web-developer.html",
  "index-web-studio.html",
  "index.html",
  "pricing.html",
  "project-details.html",
  "services.html",
  "team.html",
  "template-demos.html",
  "works-default.html",
  "works-grid-sticky.html",
  "works-grid.html",
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
          page.replace(/\.html$/, ""),
          path.resolve(templateDir, page),
        ])
      ),
    },
  },
});

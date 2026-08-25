import { defineConfig } from "vite";

const TEMPLATE_ROOT =
  "Documents/Apachestudio/azurio-digital-agency-portfolio-html-template-2026-07-08-09-12-20-utc/azurio-digital-agency-and-personal-portfolio-html-template/HTML";

export default defineConfig({
  root: TEMPLATE_ROOT,
  server: { host: "::", port: 8080 },
  build: { outDir: "../../../../../dist", emptyOutDir: true },
});

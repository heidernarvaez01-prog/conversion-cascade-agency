# URLs semánticas + auditoría SEO

Reestructurar las URLs del sitio para que describan su contenido (en español, limpias, sin `.html`) y corregir los problemas SEO detectados en la auditoría.

## Nueva estructura de URLs

Cada página pasa a una carpeta con su `index.html`, de modo que la URL final es limpia.

Principales:

| Actual | Nueva |
|---|---|
| index.html | / |
| services.html | /servicios/ |
| contact.html | /contacto/ |
| pricing.html | /planes/ |
| faq.html | /preguntas-frecuentes/ |
| about-us.html | /nosotros/ |
| about-me.html | /nuestra-historia/ |
| team.html | /equipo/ |
| works-grid.html | /casos-de-exito/ |
| project-details.html | /casos-de-exito/oxxo/ |
| blog-standard.html | /blog/ |
| blog-article.html | /blog/que-es-apache-360/ |

Servicios (hoy con nombres de plantilla):

| Actual | Nueva |
|---|---|
| index-design-studio.html | /servicios/campanas-digitales/ |
| index-digital-designer.html | /servicios/seo-growth/ |
| index-web-studio.html | /servicios/desarrollo-web/ |
| index-web-developer.html | /servicios/implementacion-tecnica/ |
| index-personal-portfolio.html | /servicios/dashboards-y-reportes/ |
| index-software-development-company.html | /servicios/apache-360/ |
| index-branding-studio.html | /servicios/social-media/ |
| index-creative-agency.html | /servicios/ecosistema-digital/ |
| index-freelancer-portfolio.html | /servicios/mantenimiento-web/ |

Blog:

| Actual | Nueva |
|---|---|
| blog-analitica-marketing-digital.html | /blog/analitica-de-marketing-digital/ |
| blog-ai-marketing.html | /blog/ai-en-marketing-digital/ |
| blog-automatizacion-marketing.html | /blog/automatizacion-de-marketing/ |
| blog-dashboard-marketing-digital.html | /blog/dashboard-de-marketing-digital/ |
| blog-implementacion-tecnica.html | /blog/implementacion-tecnica/ |
| blog-performance-marketing.html | /blog/performance-marketing/ |

Se eliminan páginas duplicadas o de demo que no aportan contenido propio: `works-default.html`, `works-grid-sticky.html` (mismo listado que casos de éxito), `blog-creative.html` (mismo listado que el blog) y `template-demos.html` (página de demos de la plantilla). `404.html` se mantiene.

Todos los enlaces internos del sitio (más de 1.300 referencias en menús, footers, tarjetas y botones) se actualizan a las nuevas rutas.

## Auditoría SEO: hallazgos y correcciones

1. **Sin `robots.txt` ni `sitemap.xml`** — se crean ambos; el sitemap incluirá todas las URLs nuevas indexables.
2. **Sin etiquetas canónicas** en ninguna página — se añade `canonical` autorreferencial con dominio `https://apachestudio.mx`.
3. **Descripciones de plantilla** en 6 páginas (404, nuestra historia, blog listado alterno, demos, y dos listados de casos): textos en inglés que hablan de "HTML template". Se reemplazan por descripciones reales del negocio.
4. **Falta H1** en 11 páginas (todos los artículos del blog, y las landings de social media, implementación técnica y desarrollo web). Se marca el título principal existente como H1 real, sin cambiar el diseño.
5. **`og:url` y `og:image` desactualizados** — se ajustan por página a su nueva URL absoluta; se homogeneizan `og:title`/`og:description` con el título y descripción reales y se añaden las etiquetas `twitter:card`.
6. **Sin datos estructurados** — se añade JSON-LD: `Organization` + `WebSite` en la home, `Service` en las landings de servicio, `Article` en los posts, `FAQPage` en preguntas frecuentes y `BreadcrumbList` en páginas internas.
7. **Títulos largos y con prefijo repetido** — varios superan los 60 caracteres por el patrón "Apache Studio - …". Se reescriben priorizando la palabra clave al inicio.
8. **`lang` y accesibilidad de imágenes** — se verifica `lang="es"` en todas las páginas y se completan los `alt` faltantes en imágenes de contenido.
9. **404 sin `noindex`** y página de demos indexable — se resuelve con la eliminación de demos y meta robots en 404.

Nota: como el hosting sirve archivos estáticos, no se configuran redirecciones 301 desde las URLs antiguas (según lo indicado). Las URLs anteriores devolverán 404 y Google las irá reemplazando por las nuevas al releer el sitemap.

## Detalles técnicos

- Se mueven los archivos a la estructura de carpetas indicada y se actualiza `rollupOptions.input` en `vite.config.ts` con las nuevas rutas de entrada, para que el build genere todas las páginas.
- Rutas de assets (`css/`, `js/`, `img/`, `video/`) pasan a ser absolutas (`/css/...`) para funcionar desde subcarpetas de segundo y tercer nivel.
- `robots.txt` y `sitemap.xml` se generan como archivos estáticos en la raíz del template y se incluyen en el build mediante `publicDir`.
- Tras publicar, conviene reenviar el sitemap en Search Console.

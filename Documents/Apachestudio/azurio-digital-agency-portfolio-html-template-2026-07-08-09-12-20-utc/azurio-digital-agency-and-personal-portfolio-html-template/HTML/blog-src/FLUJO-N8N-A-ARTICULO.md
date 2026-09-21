# Del aviso de n8n al artículo completo

Cómo se reparten el trabajo n8n, Supabase (blog dinámico), Claude y Lovable.

| Pieza | Qué hace |
|---|---|
| **n8n** | Detecta un tema o noticia y envía un **brief** (ver más abajo). Publica en Supabase una nota **corta** (≈ 250–350 palabras). |
| **Supabase / blog dinámico** | Guarda esas notas cortas. Son *complementarias*: cada una termina con un enlace al artículo completo cuando exista. |
| **Claude** | Con el brief construye el **artículo completo** con el estándar del artículo base (`blog-src/`), verificando fuentes. |
| **Lovable** | Cambios en la app: campo de enlace al artículo completo, bloque «Lee el análisis completo», autor por temática en `blog/articulo/`. |

## 1. Brief que envía n8n

```json
{
  "tema": "Meta Business Agent en WhatsApp",
  "seccion": "Automatización",
  "fecha_noticia": "2026-09-20",
  "fuentes": ["https://…", "https://…"],
  "hechos": ["Dato 1 citado en la fuente", "Dato 2 citado en la fuente"],
  "angulo_marketing": "Qué cambia para una pyme que atiende por WhatsApp",
  "palabras_clave": ["atención al cliente con IA", "WhatsApp Business"],
  "supabase_slug": "mejora-atencion-clientes-whatsapp"
}
```

Reglas del brief: solo hechos que estén en las fuentes; nada de cifras sin fuente; si hay dos o más notas del mismo tema, un solo brief.

## 2. Qué hace Claude con el brief

1. `python scripts/new_post.py <slug>` y completar `meta.json` y `body.html` (plantilla en `blog-src/_plantilla/`).
2. Verificar cada dato en fuentes oficiales y separar «lo que dice la fuente» de «criterio de trabajo».
3. `python scripts/make_og.py <slug>` y `python scripts/build_blog.py <slug>` y `--check`.
4. Registrar el par `supabase_slug → slug` en la tabla de abajo y publicar (commit y push).
5. Añadir el enlace al final de la nota de Supabase (bloque siguiente).

## 3. Bloque de enlace en la nota corta

Al final del campo `contenido` de la nota en Supabase:

```html
<p class="articulo-completo"><strong>Análisis completo:</strong> <a href="/blog/SLUG-DEL-ARTICULO/">TÍTULO DEL ARTÍCULO →</a></p>
```

Mejor a mediano plazo: una columna `articulo_url` (y `autor`) en la tabla `articulos` y que `blog/articulo/` muestre el botón solo si hay valor. Prompt para Lovable:

> En la tabla `articulos` agrega las columnas `articulo_url` (texto, opcional) y `autor` (texto, opcional). En `blog/articulo/` y en el listado del blog: si `articulo_url` tiene valor, muestra al final de la nota un botón «Leer el análisis completo» que lleve a esa URL. Muestra el `autor` en el encabezado de la nota. La función `crear-articulo` debe aceptar ambos campos y dejar `estado = 'publicado'`. No cambies el diseño existente.

## 4. Autor por temática

Los autores viven en `blog-src/site.json` → `authors`. Para asignar autor por temática, agregar en `section_authors` la sección y la clave del autor, por ejemplo:

```json
"section_authors": { "Redes sociales": "clave-del-autor", "Analítica": "heider-narvaez" }
```

Cada autor necesita: nombre, rol, bio verificable (2 líneas), foto (B/N, cuadrada) y perfil de LinkedIn. **No se inventan autores.** Hoy solo existe `heider-narvaez` y es el valor por defecto.

## 5. Correspondencia entre notas de Supabase y artículos completos

| Nota en Supabase (`slug`) | Artículo completo | Estado |
|---|---|---|
| `automatizar-reportes-marketing-260919` | `/blog/automatizar-reportes-de-marketing/` | nota mejorada y enlazada |
| `decision-judicial-csam-marketing-digital` | `/blog/contenido-ia-menores-fallo-septimo-circuito/` | construido |
| `pinterest-nvidia-alianza-potenciar-descubrimiento-ai` | `/blog/pinterest-nvidia-busqueda-visual-ia/` | construido |
| `nuevas-herramientas-creacion-gafas-ia-meta` | `/blog/gafas-ia-meta-herramientas-creacion-instagram/` | construido |
| `meta-nuevo-dispositivo-realidad-virtual` | `/blog/visor-realidad-mixta-meta-phoenix/` | construido |
| `threads-meta-superar-x` | `/blog/threads-vs-x-audiencia-marcas/` | construido |
| `influencia-youtube-cultura-popular` | `/blog/youtube-cultura-mainstream-microtendencias/` | construido |
| `mejoras-plataforma-data-manager-google` | `/blog/google-data-manager-datos-propios/` | construido |
| `tiktok-celebra-mes-herencia-hispana` | `/blog/tiktok-mes-herencia-hispana-marcas/` | construido |
| `x-incorpora-comercio-acciones` | `/blog/x-cashtags-trading-redes-sociales/` | construido |
| `x-incorpora-trading-acciones` | `/blog/x-cashtags-trading-redes-sociales/` | construido |
| `colaboraciones-creadores-instagram` | `/blog/colaboraciones-creadores-instagram-emplifi/` | construido |
| `colaboraciones-creadores-instagram-260919` | `/blog/colaboraciones-creadores-instagram-emplifi/` | construido |
| `facebook-pages-limita-publicaciones-enlaces` | `/blog/facebook-limite-enlaces-meta-one/` | construido |
| `mejora-atencion-clientes-whatsapp` | `/blog/meta-business-agent-whatsapp/` | construido |
| `facilita-atencion-cliente-ia-whatsapp` | `/blog/meta-business-agent-whatsapp/` | construido |
| `mejorar-segmentacion-empresa-linkedin-260919` | `/blog/linkedin-ads-segmentacion-audiencia/` | construido |
| `guia-planificacion-festividades-2026-meta-260919` | `/blog/meta-festividades-2026-plan/` | construido |
| `guia-reddit-planificacion-ventas-260919` | `/blog/reddit-festividades-2026-guia/` | construido |

El SQL para añadir los enlaces está en `blog-src/supabase/enlaces-a-articulos-completos.sql`. Las notas duplicadas apuntan al mismo artículo.

## 6. Investigación usada en los artículos (septiembre de 2026)

- **Threads vs X:** entrevista de Zuckerberg con *Sources* (13 sep 2026): «Threads es más grande que X o está por serlo»; Threads llegó a 500 M de usuarios activos mensuales en junio de 2026; el conteo de X no es comparable (Social Media Today, `/news/threads-might-be-bigger-than-x-says-zuckerberg/830236/`). Ángulo: importa la audiencia específica, no el tamaño total.
- **Visor de Meta (Project Phoenix):** filtraciones (no anuncio oficial) de un visor ligero con procesador externo; Meta Connect 23–24 sep 2026; lanzamiento apuntado a la primera mitad de 2027 (Road to VR, TechRadar). Escribir como rumor, después de Connect.
- **YouTube «In Search of Mainstream»:** encuesta a 939 personas de 14 a 44 años; 63 % de los de 14–29 dice que interesarse en lo mismo que otros les hace sentir parte de algo (YouTube Blog, Social Media Today `/830235/`).
- **Google Data Manager (13 sep 2026):** integración con GA y DV360, métrica *Data Strength Uplift* en Google Ads, Meridian con capacidades de agentes para auditar datos, GeoX; la cifra de «26 % de ROAS incremental» es de Google (Social Media Today `/830234/`).
- **TikTok Herencia Hispana (15 sep–15 oct):** creadores Fernando Hurtado, Jasmine Wesley y Eric Sedeño; hashtags #HispanicTikTok, #LatinTikTok, #HispanicHeritageTikTokContest, #CasaTikTok; concurso de participación (Social Media Today `/830484/`, YPulse).
- **X Cashtags (16 sep 2026):** solo EE. UU.; el usuario toca el cashtag y va a un bróker asociado (Interactive Brokers, Moomoo, Gemini, Kraken, Coinbase); la operación se completa en el bróker, no dentro de X (TechCrunch 16 sep 2026).
- **Emplifi (H1 2026):** 520,198 publicaciones de 3,791 perfiles; más de 73 % de las marcas usó publicaciones en colaboración; las aceptadas superan a las propias; marcas XS con 5 veces la interacción; en ecommerce y retail, más de 5 veces las veces compartido; Reels es el formato con más mejora (emplifi.io).
- **Facebook y enlaces:** prueba de Meta desde dic 2025 con 2 publicaciones con enlace al mes; Meta confirmó la prueba y la exención de páginas de editores; el aviso a administradores en sept 2026 lo reportan usuarios, no está confirmado por Meta (Social Media Today `/830743/`).
- **Meta Business Agent en WhatsApp:** disponible a nivel global desde junio de 2026; responde preguntas, recomienda productos del catálogo, agenda citas, califica leads, transfiere a una persona; hoy gratis, con planes de pago próximos (WhatsApp Business blog, TechCrunch 3 jun 2026).
- **LinkedIn, tamaño de audiencia:** mínimo técnico 300; sugeridos 50,000 en general, 300,000 en Sponsored Content y mensajes, 60,000–400,000 en text ads; empezar amplio y afinar (LinkedIn Marketing Solutions Help `a423690`).
- **Meta, guías de fin de año 2026:** guía de IA, de agencias, explicativa creativa, para pymes (con checklist) y playbook para anunciantes avanzados; Black Friday es el 27 de noviembre de 2026 (Social Media Today `/830741/`).
- **Reddit, guía para pymes:** 11 páginas sobre conducta de descubrimiento; categorías más buscadas; cifras de la guía: 75 % usa Reddit para reseñas honestas al buscar regalos, +120 % en menciones de «small business» en r/gifts en 2025 (Social Media Today `/830738/`; son cifras de Reddit).

## 7. Formato de la nota corta

La nota de Supabase se publica con los mismos componentes que el artículo (letra capital `<p class="drop-cap">`, `ed-callout`, `ed-cards`, `ed-table-wrap`, `<blockquote>`, `<ol>` de pasos, `ed-checklist`) y termina con el bloque `.articulo-completo`. Se arma a partir del artículo completo (ver `blog-src/supabase/notas-ricas.sql`), no del texto plano de n8n.

## 8. Barra de calidad (por qué existe)

La nota que llega de n8n es un borrador corto (unas 300 palabras, sin diagramas). Si quien construye el
artículo se limita a "ordenar" ese texto, sale un artículo mediocre. La regla es: **la nota da el tema y
el punto de partida; el artículo se investiga, se amplía y se reescribe si hace falta**.

`python scripts/build_blog.py --check` avisa con `CALIDAD` cuando un artículo queda por debajo del base:

| Requisito | Mínimo |
|---|---|
| Palabras (sin SVG) | 1500 (objetivo 2000-2500) |
| Diagramas SVG o tarjetas `ed-cards` | 2 |
| Tablas `ed-table-wrap` | 2 |
| Callout, checklist, letra capital | 1 de cada uno |
| Preguntas frecuentes / fuentes oficiales | 4 / 3 |

El mismo estándar está en el «conocimiento del proyecto» de Lovable, para que lo aplique al crear
`blog-src/<slug>/`. Lovable no puede ejecutar el generador: después de que escriba las fuentes hay que
correr `python scripts/build_blog.py` (crea la página, el listado, el sitemap y la imagen OG si falta).

Artículo de referencia de esta barra: `remarketing-como-recuperar-clientes-260920` (reescrito a partir del
borrador de Lovable) y `dashboard-de-marketing-digital`.

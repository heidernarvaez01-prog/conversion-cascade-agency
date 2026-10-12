# Rediseño UX/CRO de páginas de servicios

Simplificar y ordenar las páginas de servicios para que cada una explique con rapidez qué resuelve, para quién es y por qué el método de APaCHe Studio —datos, automatización e IA con criterio humano— supera un proceso tradicional, sin perder las animaciones ni la identidad visual actual.

## Cambios principales

### 1. Claridad comercial en cada servicio
- Reescribir el primer bloque de las nueve páginas con una promesa concreta, el resultado esperado y una acción principal.
- Reducir párrafos largos a frases breves, beneficios escaneables y entregables específicos.
- Sustituir mensajes genéricos por una estructura constante: problema, solución, ventaja, proceso y siguiente paso.
- Eliminar o reformular cifras y resultados no sustentados para evitar promesas poco creíbles.

### 2. Diferenciación por IA, sin discurso genérico
- Añadir en cada servicio una comparación breve entre el método tradicional y el método APaCHe Studio.
- Explicar la ventaja específica de la IA según el servicio: detección de patrones, priorización, alertas, variaciones creativas, análisis diario o automatización.
- Dejar claro que la IA acelera y mejora decisiones, mientras el equipo define estrategia, valida calidad y ejecuta.

### 3. Navegación más simple
- Reorganizar `/servicios/` para mostrar y agrupar los nueve servicios; actualmente el listado principal solo destaca cuatro.
- Añadir una navegación interna corta en páginas largas para saltar a beneficios, proceso, entregables y contacto.
- Corregir enlaces sin destino (`#0`) y botones ambiguos como “Ver más”, llevándolos a una sección real, contacto o eliminando su apariencia interactiva.
- Mantener una llamada principal coherente hacia `/contacto/` y una secundaria hacia las credenciales.

### 4. Credenciales siempre visibles
- Conservar “Descargar Credenciales” en el encabezado de todas las páginas de servicio.
- Añadir el mismo acceso dentro del menú hamburguesa y en el pie de página, para que no dependa del encabezado.
- Añadir una invitación contextual a descargar el PDF en el cuerpo de las páginas extensas.
- Verificar que `/credenciales.pdf` se incluya en el sitio publicado y que la descarga funcione desde páginas interiores y móvil.

### 5. Limpieza visual y de contenido
- Reemplazar imágenes genéricas de plantilla por recursos reales ya disponibles cuando representen mejor el servicio.
- Corregir textos de plantilla, etiquetas en inglés sin intención comercial y enlaces decorativos que aparentan ser casos reales.
- Preservar videos, parallax, carruseles, marquesinas y clases usadas por las animaciones; los cambios se concentrarán en contenido, destinos y orden narrativo.

## Mensaje por servicio

| Servicio | Promesa central |
|---|---|
| Campañas digitales | Inversión optimizada con señales de negocio, no solo clics |
| SEO Growth | Prioridades SEO detectadas con datos e IA, ejecutadas por especialistas |
| Desarrollo web | Sitios rápidos, medibles y diseñados para convertir |
| Implementación técnica | Datos confiables para que campañas y analítica aprendan correctamente |
| Dashboards y reportes | Decisiones diarias sin consolidar reportes manualmente |
| Social media | Contenido y comunidad guiados por señales reales de audiencia |
| Mantenimiento web | Prevención, monitoreo y mejora continua antes de que fallen las ventas |
| Ecosistema digital | Canales, datos y automatizaciones operando como un solo sistema |
| APaCHe 360 | Control unificado del marketing con análisis y alertas asistidos por IA |

## Validación
- Revisar en escritorio y móvil el índice de servicios, dos páginas de estructuras distintas y el menú global.
- Comprobar navegación interna, contacto, descarga del PDF, imágenes y ausencia de enlaces rotos.
- Confirmar que las animaciones de entrada, scroll, carruseles y transiciones siguen funcionando.
- Revisar el resultado final de las nueve páginas para asegurar mensajes breves, diferenciación clara y llamadas a la acción consistentes.

## Detalles técnicos
- Se conservará la estructura HTML y los selectores de GSAP/Lenis/Swiper que sostienen las animaciones.
- Los cambios del menú y pie se replicarán en todas las páginas de servicios porque actualmente están duplicados en cada archivo.
- No se modificarán precios, formularios, automatizaciones ni páginas del blog.

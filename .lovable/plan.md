# Reemplazo de imágenes decorativas y de transición

## Objetivo
Sustituir las imágenes de plantilla (`/img/demo/...`) que aparecen en el loader, en el rastro del cursor (cursor trail), en las miniaturas del menú y en bloques decorativos, por imágenes propias de Apache Studio, sin alterar el diseño ni las proporciones de la plantilla.

## Situación actual
- El loader (`.mxd-loader__images`) usa 7 imágenes de `img/demo/trail/` y `img/demo/*_fea/pages-img.webp`.
- El rastro de cursor (`mxd-trail-transparent-image`) usa mezclas de `img/demo/inner/`, `trail/` y `screens/`.
- En total hay ~50 assets demo distintos referenciados desde 26 páginas HTML.
- Ya existe un inventario real sin usar en `img/real/`: `services/` (18 imágenes), `portfolio/` (7 mockups), `dashboards/` (9 capturas), `illustrations/` (21), `platforms/`, `tools/`, `marquee/`, `blog/`.

## Qué se hará

1. **Mapa de reemplazo por rol visual**, respetando relación de aspecto para no romper el layout:
   - Vertical (1000x1413, `inner/*`) → mockups verticales de `img/real/portfolio/` e `illustrations/` recortados al mismo aspecto.
   - Cuadrado (600x600, `trail/*`) → recortes cuadrados de `img/real/services/`, `dashboards/` y `marquee/`.
   - Horizontal (900x563, `screens/*` y 640x400 `components/*`) → capturas reales de dashboards y mockups web.
   - Grandes de sección (`01_fea-img`, `01_pages-img`, `02_pages-img`) → imágenes hero de `img/real/services/`.

2. **Generación de las piezas faltantes**: donde el inventario real no cubra un aspecto o se repita demasiado, se generan imágenes nuevas alineadas a la identidad (paleta oscura azul/cian con acentos verde y rosa, estética tech premium, sin texto legible) y se guardan en `img/real/decor/`.

3. **Recorte y optimización**: cada imagen se convierte a `.webp` con las dimensiones exactas del asset que reemplaza, para que el CSS existente siga funcionando sin tocar estilos.

4. **Sustitución en HTML**: script que reemplaza las rutas en las 26 páginas y actualiza el `alt` genérico ("Apache Studio Template ... Image") por descripciones en español coherentes con la imagen.

5. **Sin cambios de diseño**: no se tocan CSS, JS ni la estructura de los bloques; solo `src` y `alt`.

6. **Verificación**: build de producción, chequeo de que no queden rutas rotas ni referencias a los demo reemplazados, y revisión visual con navegador en home, un servicio, blog y contacto (loader + trail incluidos).

## Alcance excluido
- Logos de marcas, favicons, iconos y `img/tech/` se mantienen.
- Blog: solo se cambian los decorativos compartidos (loader/trail), no las imágenes de artículo ya reales.

## Detalle técnico
- Reemplazo mediante script Python con Pillow (recorte "cover" + export webp calidad 82).
- Nuevos assets bajo `img/real/decor/` para no mezclar con los originales de la plantilla.
- Los archivos `img/demo/` se conservan en disco por si se necesita revertir.

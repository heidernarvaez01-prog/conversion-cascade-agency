-- Enlaza las 4 notas de n8n de octubre de 2026 con su artículo completo estático (la nota redirige al artículo).
update articulos set contenido = contenido || '<p class="articulo-completo"><strong>Análisis completo:</strong> <a href="/blog/meta-ads-o-google-ads-segun-negocio-261003/">Meta Ads o Google Ads: cuál conviene según tu tipo de negocio y cómo probarlo →</a></p>'
 where slug = 'meta-ads-o-google-ads-segun-negocio-261003' and contenido not like '%articulo-completo%';
update articulos set contenido = contenido || '<p class="articulo-completo"><strong>Análisis completo:</strong> <a href="/blog/sitio-web-listo-campanas-261004/">Cómo saber si tu sitio web está listo para recibir campañas: auditoría antes de invertir →</a></p>'
 where slug = 'sitio-web-listo-campanas-261004' and contenido not like '%articulo-completo%';
update articulos set contenido = contenido || '<p class="articulo-completo"><strong>Análisis completo:</strong> <a href="/blog/senales-rediseno-sitio-web-261005/">Señales de que tu sitio web necesita un rediseño (y cuándo conviene optimizar en su lugar) →</a></p>'
 where slug = 'senales-rediseno-sitio-web-261005' and contenido not like '%articulo-completo%';
update articulos set contenido = contenido || '<p class="articulo-completo"><strong>Análisis completo:</strong> <a href="/blog/que-es-una-agencia-de-marketing-digital/">Agencia de marketing digital: qué incluye, cuánto control debes conservar y cómo elegir →</a></p>'
 where slug = 'que-es-una-agencia-de-marketing-digital' and contenido not like '%articulo-completo%';

# Envío del formulario al webhook de diagnóstico

## Objetivo
Enviar cada registro del formulario de contacto al nuevo webhook de n8n, manteniendo el guardado actual en la base de datos.

## Cambios
1. Sustituir la integración anterior de Google Sheets por `https://n8n-huou.srv1971812.hstgr.cloud/webhook/diagnostico-lead`.
2. Enviar al webhook el mismo contenido del formulario: nombre, correo, teléfono, empresa, mensaje, fuente y página de origen.
3. Mantener el webhook como envío complementario: si n8n falla, el registro principal seguirá guardándose.
4. Enviar un registro identificable de prueba desde el formulario real.
5. Confirmar por separado la respuesta del webhook y el guardado del registro.

## Resultado esperado
El nuevo contacto aparecerá en la automatización de n8n y también quedará registrado en la base de datos actual.

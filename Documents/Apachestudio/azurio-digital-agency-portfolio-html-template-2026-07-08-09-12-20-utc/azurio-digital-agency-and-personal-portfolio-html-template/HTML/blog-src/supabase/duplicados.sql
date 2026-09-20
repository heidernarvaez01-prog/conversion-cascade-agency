-- Notas duplicadas: se conserva una por tema y las otras se pasan a borrador (reversible: estado = 'publicado').
-- Los artículos completos ya unifican los temas. Ejecutar solo si quieres retirar los duplicados del blog dinámico.

update articulos set estado = 'borrador' where slug in ('x-incorpora-comercio-acciones', 'colaboraciones-creadores-instagram-260919', 'facilita-atencion-cliente-ia-whatsapp');

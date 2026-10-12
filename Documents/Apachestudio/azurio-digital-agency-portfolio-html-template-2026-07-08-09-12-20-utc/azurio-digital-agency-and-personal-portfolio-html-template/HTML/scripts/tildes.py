#!/usr/bin/env python3
"""Restituye tildes y ñ en el texto visible, los metadatos y el JSON-LD de las páginas hechas a mano.

Uso (desde HTML/):  python scripts/tildes.py [--detalle] [--aplicar]   (sin --aplicar solo muestra la vista previa)

Solo toca texto entre etiquetas, los atributos alt/title/aria-label/placeholder, el content de los meta
description/og/twitter y los valores name/description/headline/text del JSON-LD. Nunca URLs, clases, ids,
nombres de archivo ni scripts. Las palabras ambiguas (que/qué, si/sí, tu/tú) no se tocan; «mas de» sí se
corrige a «más de» porque no tiene otra lectura en estos textos.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

PALABRAS = {
    "analitica": "analítica", "analiticas": "analíticas", "analitico": "analítico", "analiticos": "analíticos",
    "gestion": "gestión", "medicion": "medición", "automatizacion": "automatización",
    "tecnica": "técnica", "tecnicas": "técnicas", "tecnico": "técnico", "tecnicos": "técnicos",
    "ejecucion": "ejecución", "campana": "campaña", "campanas": "campañas", "pagina": "página",
    "paginas": "páginas", "tambien": "también", "auditoria": "auditoría", "auditorias": "auditorías",
    "informacion": "información", "configuracion": "configuración", "implementacion": "implementación",
    "conversion": "conversión", "optimizacion": "optimización", "integracion": "integración",
    "publicacion": "publicación", "descripcion": "descripción", "atencion": "atención",
    "solucion": "solución", "operacion": "operación", "direccion": "dirección", "creacion": "creación",
    "relacion": "relación", "sesion": "sesión", "diseno": "diseño", "disenamos": "diseñamos",
    "metrica": "métrica", "metricas": "métricas", "analisis": "análisis", "trafico": "tráfico",
    "organico": "orgánico", "automatico": "automático", "automaticos": "automáticos",
    "automatica": "automática", "automaticas": "automáticas", "tecnologia": "tecnología",
    "tecnologias": "tecnologías", "rapido": "rápido", "rapida": "rápida", "espanol": "español",
    "creditos": "créditos", "credito": "crédito", "manana": "mañana", "politica": "política",
    "unico": "único", "unica": "única", "facil": "fácil", "facilmente": "fácilmente", "despues": "después",
    "estrategico": "estratégico", "estrategica": "estratégica", "ademas": "además", "dias": "días",
    "comunicacion": "comunicación", "produccion": "producción", "educacion": "educación",
    "administracion": "administración", "evaluacion": "evaluación", "colaboracion": "colaboración",
    "inversion": "inversión", "recomendacion": "recomendación", "navegacion": "navegación",
    "seleccion": "selección", "reunion": "reunión", "decision": "decisión", "vision": "visión",
    "mision": "misión", "practica": "práctica", "practicas": "prácticas", "practico": "práctico",
    "basico": "básico", "basica": "básica", "basicos": "básicos", "basicas": "básicas",
    "estadistica": "estadística", "estadisticas": "estadísticas", "categoria": "categoría",
    "categorias": "categorías", "garantia": "garantía", "garantias": "garantías", "compania": "compañía",
    "companias": "compañías", "tecnologico": "tecnológico", "tecnologica": "tecnológica",
    "metodologia": "metodología", "proximo": "próximo", "proxima": "próxima", "logistica": "logística",
    "sistematica": "sistemática", "especifica": "específica", "especifico": "específico",
    "magnitud": "magnitud", "demostracion": "demostración", "presentacion": "presentación",
    "conexion": "conexión", "conexiones": "conexiones", "migracion": "migración",
    "actualizacion": "actualización", "actualizaciones": "actualizaciones",
    "envia": "envía", "nacio": "nació", "codigo": "código", "catalogo": "catálogo",
}
PALABRAS = {k: v for k, v in PALABRAS.items() if k != v}
EXTRA = [(r"\bmas de\b", "más de"), (r"\bMas de\b", "Más de")]
RE_PAL = re.compile(r"\b(" + "|".join(sorted(map(re.escape, PALABRAS), key=len, reverse=True)) + r")\b", re.I)


def _caso(orig, nuevo):
    if orig.isupper() and len(orig) > 1:
        return nuevo.upper()
    if orig[0].isupper():
        return nuevo[0].upper() + nuevo[1:]
    return nuevo


def arreglar(texto):
    if not texto.strip():
        return texto
    out = RE_PAL.sub(lambda m: _caso(m.group(0), PALABRAS[m.group(0).lower()]), texto)
    for pat, rep in EXTRA:
        out = re.sub(pat, rep, out)
    return out


ATTR_TEXTO = re.compile(r'(\b(?:alt|title|aria-label|placeholder)=")([^"]*)(")')
META = re.compile(r'(<meta\s+(?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)"\s+content=")([^"]*)(")')
LD_CLAVES = re.compile(r'("(?:name|description|headline|text|alternateName)"\s*:\s*")((?:[^"\\]|\\.)*)(")')
TAG = re.compile(r"(<[^>]+>)")


def procesar(html):
    def ld(m):
        cuerpo = LD_CLAVES.sub(lambda k: k.group(1) + arreglar(k.group(2)) + k.group(3), m.group(2))
        return m.group(1) + cuerpo + m.group(3)

    html = re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', ld, html, flags=re.S)
    partes = TAG.split(html)
    saltar = None
    for i, p in enumerate(partes):
        if i % 2 == 1:
            baja = p.lower()
            if saltar is None:
                m = re.match(r"<(script|style)\b", baja)
                if m and not baja.endswith("/>"):
                    saltar = m.group(1)
            elif baja.startswith("</" + saltar):
                saltar = None
            if baja.startswith("<meta"):
                partes[i] = META.sub(lambda k: k.group(1) + arreglar(k.group(2)) + k.group(3), p)
            else:
                partes[i] = ATTR_TEXTO.sub(lambda k: k.group(1) + arreglar(k.group(2)) + k.group(3), p)
        elif saltar is None:
            partes[i] = arreglar(p)
    return "".join(partes)


def archivos():
    pats = ["index.html", "404.html", "contacto/index.html", "equipo/index.html", "nosotros/index.html",
            "nuestra-historia/index.html", "planes/index.html", "preguntas-frecuentes/index.html",
            "servicios/index.html", "servicios/*/index.html", "blog/index.html", "blog/articulo/index.html",
            "blog-src/_page.html", "blog-src/_breadcrumbs.html"]
    vistos = []
    for p in pats:
        for f in sorted(ROOT.glob(p)):
            if f not in vistos:
                vistos.append(f)
    return vistos


if __name__ == "__main__":
    aplicar = "--aplicar" in sys.argv
    total = 0
    for f in archivos():
        orig = f.read_text(encoding="utf-8")
        nuevo = procesar(orig)
        if nuevo == orig:
            continue
        pares = [(a, b) for a, b in zip(re.findall(r"\S+", orig), re.findall(r"\S+", nuevo)) if a != b]
        total += len(pares)
        print(f"{f.relative_to(ROOT)}: {len(pares)} palabras")
        if "--detalle" in sys.argv:
            ya = set()
            for a, b in pares:
                if (a, b) not in ya:
                    ya.add((a, b))
                    print(f"    {a[:70]}  ->  {b[:70]}")
        if aplicar:
            f.write_text(nuevo, encoding="utf-8", newline="")
    print(f"\nTotal: {total} palabras" + (" (aplicado)" if aplicar else " (solo vista previa)"))

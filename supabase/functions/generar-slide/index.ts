import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { initWasm, Resvg } from 'npm:@resvg/resvg-wasm@2.6.2'

const W = 1080
const H = 1350
const DARK = '#0F0F0F'
const CREAM = '#EEEAE8'
const BLUE = '#002BBA'
const PINK = '#F73E9B'

let wasmReady: Promise<void> | null = null
const initResvg = () => {
  if (!wasmReady) {
    wasmReady = initWasm(
      fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm'),
    )
  }
  return wasmReady
}

let fontsPromise: Promise<Uint8Array[]> | null = null
const loadFonts = () => {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const css = await fetch(
        'https://fonts.googleapis.com/css?family=Archivo+Black|Inter:400,700',
        { headers: { 'User-Agent': 'Mozilla/4.0' } },
      ).then((r) => r.text())
      const urls = [...css.matchAll(/url\((https:\/\/[^)]+\.ttf)\)/g)].map((m) => m[1])
      return await Promise.all(
        urls.map(async (u) => new Uint8Array(await (await fetch(u)).arrayBuffer())),
      )
    })()
  }
  return fontsPromise
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// rough width estimation (no text metrics in SVG rasterizer)
const widthOf = (text: string, size: number, factor: number) => text.length * size * factor

const wrap = (text: string, maxChars: number): string[] => {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (!cur) cur = w
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w
    else {
      lines.push(cur)
      cur = w
    }
  }
  if (cur) lines.push(cur)
  return lines
}

const arrow = (x: number, y: number) =>
  `<text x="${x}" y="${y}" font-family="Archivo Black" font-size="72" fill="${PINK}" text-anchor="end">&gt;</text>`

function svgPortada(lineas: { texto: string; destacada?: boolean }[], subtitulo: string) {
  const M = 80
  const FS = 84
  const BOX_H = 112
  const GAP = 14
  const PAD = 26
  const blocks: string[] = []
  let y = 230
  for (const l of lineas.slice(0, 7)) {
    const t = (l.texto || '').toUpperCase()
    const w = Math.min(W - M * 2, widthOf(t, FS, 0.76) + PAD * 2)
    const bg = l.destacada ? BLUE : CREAM
    const fg = l.destacada ? '#FFFFFF' : '#0F0F0F'
    blocks.push(
      `<rect x="${M}" y="${y}" width="${w}" height="${BOX_H}" fill="${bg}" rx="4"/>` +
        `<text x="${M + PAD}" y="${y + BOX_H - 30}" font-family="Archivo Black" font-size="${FS}" fill="${fg}">${esc(t)}</text>`,
    )
    y += BOX_H + GAP
  }
  y += 60
  const sub = wrap(subtitulo || '', 46)
    .slice(0, 4)
    .map((line, i) =>
      `<text x="${M}" y="${y + i * 52}" font-family="Inter" font-size="36" fill="#FFFFFF">${esc(line)}</text>`,
    )
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${DARK}"/>
${blocks.join('')}
${sub}
<text x="${M}" y="${H - 80}" font-family="Inter" font-weight="700" font-size="34" fill="#FFFFFF">apachestudio.mx</text>
${arrow(W - M, H - 72)}
</svg>`
}

function svgIdea(numero: number, texto1: string, texto2: string) {
  const M = 80
  const FS = 84
  const BOX_H = 112
  const PAD = 26
  const label = `NÚMERO ${numero}`
  const boxW = Math.min(W - M * 2, widthOf(label, FS, 0.76) + PAD * 2)
  let y = 300
  const head =
    `<text x="${M}" y="${y}" font-family="Archivo Black" font-size="${FS}" fill="#FFFFFF">IDEA</text>` +
    `<rect x="${M}" y="${y + 34}" width="${boxW}" height="${BOX_H}" fill="${CREAM}" rx="4"/>` +
    `<text x="${M + PAD}" y="${y + 34 + BOX_H - 30}" font-family="Archivo Black" font-size="${FS}" fill="#0F0F0F">${esc(label)}</text>`
  y = y + 34 + BOX_H + 110
  let body = ''
  for (const p of [texto1, texto2]) {
    if (!p || !p.trim()) continue
    const lines = wrap(p.trim(), 42)
    for (const line of lines) {
      body += `<text x="${M}" y="${y}" font-family="Inter" font-size="40" fill="#FFFFFF">${esc(line)}</text>`
      y += 58
    }
    y += 44
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${BLUE}"/>
${head}
${body}
<text x="${M}" y="${H - 80}" font-family="Inter" font-weight="700" font-size="34" fill="#FFFFFF">@apachestudio.mx</text>
${arrow(W - M, H - 72)}
</svg>`
}

export async function renderSlide(payload: Record<string, unknown>): Promise<Uint8Array> {
  const tipo = String(payload.tipo || '')
  let svg: string
  if (tipo === 'portada') {
    const lineas = Array.isArray(payload.lineas) ? (payload.lineas as any[]) : []
    svg = svgPortada(lineas, String(payload.subtitulo ?? ''))
  } else {
    svg = svgIdea(
      Number(payload.numero ?? 1),
      String(payload.texto1 ?? ''),
      String(payload.texto2 ?? ''),
    )
  }
  await initResvg()
  const fonts = await loadFonts()
  const resvg = new Resvg(svg, {
    background: 'rgba(0,0,0,1)',
    fitTo: { mode: 'width', value: W },
    font: { fontBuffers: fonts, defaultFontFamily: 'Inter', loadSystemFonts: false },
  })
  return resvg.render().asPng()
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
      },
    })
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const expected = Deno.env.get('N8N_API_KEY')
  if (!expected || req.headers.get('x-api-key') !== expected) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const tipo = String(payload.tipo || '')
  if (tipo !== 'portada' && tipo !== 'idea') {
    return json({ error: "tipo debe ser 'portada' o 'idea'" }, 400)
  }
  if (tipo === 'portada' && (!Array.isArray(payload.lineas) || payload.lineas.length === 0)) {
    return json({ error: 'lineas es obligatorio para tipo portada' }, 400)
  }
  if (tipo === 'idea' && !String(payload.texto1 ?? '').trim()) {
    return json({ error: 'texto1 es obligatorio para tipo idea' }, 400)
  }

  try {
    const png = await renderSlide(payload)
    return new Response(png, {
      headers: { ...corsHeaders, 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
    })
  } catch (e) {
    return json({ error: `Error generando la imagen: ${(e as Error).message}` }, 500)
  }
})

import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key' } })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const apiKey = req.headers.get('x-api-key')
  const expected = Deno.env.get('N8N_API_KEY')
  if (!expected || apiKey !== expected) {
    return json({ error: 'Unauthorized' }, 401)
  }

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const titulo = str(payload.titulo)
  let slug = str(payload.slug)
  const contenido = str(payload.contenido)
  const resumen = str(payload.resumen)
  const imagen_portada = str(payload.imagen_portada)
  const estado = str(payload.estado) || 'publicado'
  const meta_title = str(payload.meta_title)
  const meta_description = str(payload.meta_description)
  const keyword_principal = str(payload.keyword_principal)
  const pilar = str(payload.pilar)
  const intencion = str(payload.intencion)
  const json_ld = str(payload.json_ld)

  let keywords_secundarias: string[] | null = null
  if (Array.isArray(payload.keywords_secundarias)) {
    keywords_secundarias = payload.keywords_secundarias
      .filter((k): k is string => typeof k === 'string')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 30)
  }

  let faq: unknown = null
  if (payload.faq !== undefined && payload.faq !== null) {
    if (typeof payload.faq === 'object') {
      faq = payload.faq
    } else if (typeof payload.faq === 'string') {
      try {
        faq = JSON.parse(payload.faq)
      } catch {
        return json({ error: 'faq debe ser un objeto/array JSON válido' }, 400)
      }
    } else {
      return json({ error: 'faq debe ser un objeto/array JSON válido' }, 400)
    }
  }

  const errors: string[] = []
  if (!titulo || titulo.length > 300) errors.push('titulo es obligatorio (max 300)')
  if (!contenido) errors.push('contenido es obligatorio')
  if (slug.length > 300) errors.push('slug demasiado largo')
  if (meta_title.length > 300) errors.push('meta_title demasiado largo')
  if (meta_description.length > 500) errors.push('meta_description demasiado larga')
  if (errors.length) return json({ error: errors }, 400)

  if (!slug) {
    slug = titulo
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data, error } = await supabase
    .from('articulos')
    .insert({
      titulo,
      slug,
      contenido,
      resumen: resumen || null,
      imagen_portada: imagen_portada || null,
      estado,
      meta_title: meta_title || null,
      meta_description: meta_description || null,
      keyword_principal: keyword_principal || null,
      keywords_secundarias,
      pilar: pilar || null,
      intencion: intencion || null,
      faq,
      json_ld: json_ld || null,
      fecha_actualizacion: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    const status = error.code === '23505' ? 409 : 500
    return json({ error: error.message, code: error.code }, status)
  }

  return json({ success: true, articulo: data, slug: data.slug }, 201)
})

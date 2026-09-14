CREATE TABLE public.articulos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo text NOT NULL,
  slug text UNIQUE NOT NULL,
  resumen text,
  contenido text NOT NULL,
  imagen_portada text,
  estado text DEFAULT 'publicado',
  fecha_publicacion timestamptz DEFAULT now()
);

GRANT SELECT, INSERT ON public.articulos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articulos TO authenticated;
GRANT ALL ON public.articulos TO service_role;

ALTER TABLE public.articulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read articulos" ON public.articulos FOR SELECT TO anon USING (true);
CREATE POLICY "Public can insert articulos" ON public.articulos FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "Public insert articulos" ON public.articulos;
DROP POLICY IF EXISTS "Anyone can insert articulos" ON public.articulos;
DROP POLICY IF EXISTS "Insert publico articulos" ON public.articulos;
DROP POLICY IF EXISTS "public insert" ON public.articulos;

REVOKE INSERT, UPDATE, DELETE ON public.articulos FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.articulos FROM authenticated;
GRANT SELECT ON public.articulos TO anon, authenticated;
GRANT ALL ON public.articulos TO service_role;
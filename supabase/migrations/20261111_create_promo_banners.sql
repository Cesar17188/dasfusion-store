-- ============================================================================
-- MIGRATION: Tabla de Banners Publicitarios para el Carrusel de Tienda
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL DEFAULT '/',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar las 2 imágenes por defecto si la tabla está vacía
INSERT INTO public.promo_banners (title, subtitle, image_url, display_order, is_active)
SELECT
  'Temporada Gaming & Estaciones de Trabajo Pro',
  'Potencia extrema con procesadores de última generación, refrigeración líquida y gráficas de alto rendimiento',
  'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1600&q=85',
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.promo_banners);

INSERT INTO public.promo_banners (title, subtitle, image_url, display_order, is_active)
SELECT
  'Especial Producción Audiovisual & Broadcast 4K',
  'Cámaras mirrorless, óptica profesional, micrófonos de estudio e iluminación RGB para creadores en Ecuador',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1600&q=85',
  2,
  true
WHERE (SELECT COUNT(*) FROM public.promo_banners) = 1;


-- ============================================================================
-- Migración: Añadir columna payment_receipt_url a la tabla sales_orders
-- Descripción: Permite almacenar la imagen o URL del comprobante de pago
--              (opcional) desde la tabla de Manejo de Pedidos en el Admin.
-- ============================================================================

-- 1. Agregar la columna opcional payment_receipt_url a sales_orders
ALTER TABLE public.sales_orders
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT NULL;

COMMENT ON COLUMN public.sales_orders.payment_receipt_url IS 'URL o Data URL (Base64) de la imagen del comprobante de pago subida opcionalmente en el manejo de pedidos.';

-- 2. Asegurar políticas RLS en sales_orders para permitir actualizar el comprobante y el estado del pedido
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sales_orders'
      AND policyname = 'Permitir actualizar pedidos y comprobantes'
  ) THEN
    CREATE POLICY "Permitir actualizar pedidos y comprobantes"
      ON public.sales_orders
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;


-- Agregar campo rejection_note a la tabla orders
-- Ejecuta esto en Supabase SQL Editor

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rejection_note text;

-- Verificar que se agregó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'rejection_note';

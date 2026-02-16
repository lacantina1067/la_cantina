-- Agregar columna stock a la tabla products
-- Ejecuta esto en Supabase SQL Editor

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0 NOT NULL;

-- Agregar constraint para que el stock no sea negativo
ALTER TABLE public.products 
ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);

-- Verificar que se agregó correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name = 'stock';

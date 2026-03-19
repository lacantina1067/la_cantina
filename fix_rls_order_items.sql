

-- 1. Habilitar RLS en la tabla (por si acaso no está)
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 2. Crear política para permitir INSERTAR items
-- Esta política permite insertar items SOLO si la orden pertenece al usuario autenticado
CREATE POLICY "Estudiantes pueden agregar items a sus ordenes"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.student_id = auth.uid()
  )
);

-- 3. Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'order_items';

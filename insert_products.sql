-- Insertar productos de prueba en Supabase
-- Ejecuta esto en Supabase SQL Editor

INSERT INTO public.products (nombre, descripcion, precio, imagen_url, esta_activo) VALUES
('Hamburguesa', 'Deliciosa hamburguesa con queso', 5.99, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', true),
('Papas Fritas', 'Papas fritas crujientes', 2.99, 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500', true),
('Refresco', 'Refresco refrescante', 1.99, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500', true),
('Pizza', 'Rebanada de pizza de pepperoni', 3.50, 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500', true),
('Empanada de Carne', 'Empanada frita rellena de carne molida', 1.50, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500', true),
('Cachito de Jamón', 'Panecillo relleno de jamón ahumado', 2.00, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500', true),
('Arepa Reina Pepiada', 'Arepa rellena de pollo y aguacate', 3.00, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500', true),
('Tequeños (5 unidades)', 'Dedos de queso empanizados', 2.50, 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=500', true),
('Malta', 'Bebida de malta dulce carbonatada', 1.50, 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=500', true),
('Papas Pringles', 'Lata pequeña de papas originales', 2.50, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500', true),
('Torta de Chocolate', 'Porción de torta húmeda de chocolate', 3.50, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', true),
('Donas Glaseadas', 'Dona clásica con glaseado de azúcar', 1.20, 'https://images.unsplash.com/photo-1514517521153-1be72277b32f?w=500', true);

-- Verificar que se insertaron correctamente
SELECT id, nombre, precio, esta_activo FROM public.products;

-- =====================================================
-- Ejecuta esto en el SQL Editor de Supabase
-- ANTES de ejecutar setup_approve_order.sql
-- =====================================================

-- Tabla de solicitudes de recarga por Pago Móvil
CREATE TABLE IF NOT EXISTS public.recharge_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  parent_id uuid NOT NULL,
  student_id uuid NOT NULL,
  student_nombre text NOT NULL,
  monto numeric NOT NULL CHECK (monto > 0),
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  referencia text NOT NULL,
  telefono_origen text NOT NULL,
  cedula_tipo text NOT NULL DEFAULT 'V' CHECK (cedula_tipo IN ('V', 'E', 'J')),
  cedula_numero text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT recharge_requests_pkey PRIMARY KEY (id),
  CONSTRAINT recharge_requests_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.profiles(id),
  CONSTRAINT recharge_requests_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);

ALTER TABLE public.recharge_requests ENABLE ROW LEVEL SECURITY;

-- Padres pueden ver y crear sus propias solicitudes
CREATE POLICY "Padres ven sus solicitudes"
ON public.recharge_requests FOR SELECT
TO authenticated
USING (parent_id = auth.uid());

CREATE POLICY "Padres crean solicitudes"
ON public.recharge_requests FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());

-- Admins (rol = 'admin') pueden ver todas y actualizarlas
CREATE POLICY "Admin ve todas las solicitudes"
ON public.recharge_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

CREATE POLICY "Admin actualiza solicitudes"
ON public.recharge_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

-- Tabla wallets: permitir que admins actualicen e inserten
CREATE POLICY "Admin actualiza wallets"
ON public.wallets FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

CREATE POLICY "Admin inserta wallets"
ON public.wallets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND rol = 'admin'
  )
);

-- =====================================================
-- Ejecuta esto en el SQL Editor de Supabase
-- IMPORTANTE: Ejecuta setup_recharge_requests.sql PRIMERO
-- =====================================================

-- Política para que padres puedan leer el saldo de su hijo
-- (Necesario para mostrar saldo en el modal de aprobación)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'wallets' AND policyname = 'Padres leen saldo de su hijo'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Padres leen saldo de su hijo"
      ON public.wallets FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = wallets.user_id AND parent_id = auth.uid()
        )
      )
    $policy$;
  END IF;
END;
$$;

-- Tabla de historial de transacciones (recargas y compras)
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('recharge', 'purchase')),
  amount numeric NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT token_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT token_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propias transacciones"
ON public.token_transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins insertan transacciones"
ON public.token_transactions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Función para aprobar pedido y descontar saldo (atómico)
CREATE OR REPLACE FUNCTION approve_order_and_deduct(order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ord public.orders%ROWTYPE;
  current_saldo numeric;
BEGIN
  -- Obtener la orden
  SELECT * INTO ord FROM public.orders WHERE id = order_id AND estado = 'pendiente';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada o ya procesada';
  END IF;

  -- Obtener saldo actual del estudiante
  SELECT saldo INTO current_saldo FROM public.wallets WHERE user_id = ord.student_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El estudiante no tiene saldo disponible. Recarga su billetera primero.';
  END IF;

  -- Verificar saldo suficiente
  IF current_saldo < ord.monto_total THEN
    RAISE EXCEPTION 'Saldo insuficiente. Disponible: Bs.S %, Requerido: Bs.S %',
      round(current_saldo::numeric, 2), round(ord.monto_total::numeric, 2);
  END IF;

  -- Descontar saldo
  UPDATE public.wallets
  SET saldo = saldo - ord.monto_total, updated_at = now()
  WHERE user_id = ord.student_id;

  -- Aprobar pedido
  UPDATE public.orders
  SET estado = 'aprobado_por_padre', updated_at = now()
  WHERE id = order_id;

  -- Registrar transacción
  INSERT INTO public.token_transactions (user_id, type, amount, description)
  VALUES (ord.student_id, 'purchase', -ord.monto_total, 'Compra en cantina');
END;
$$;

-- Actualizar approve_recharge para registrar transacción también
CREATE OR REPLACE FUNCTION approve_recharge(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  req public.recharge_requests%ROWTYPE;
  current_saldo numeric;
BEGIN
  SELECT * INTO req FROM public.recharge_requests WHERE id = request_id AND estado = 'pendiente';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud no encontrada o ya procesada';
  END IF;

  UPDATE public.recharge_requests SET estado = 'aprobado', updated_at = now() WHERE id = request_id;

  SELECT saldo INTO current_saldo FROM public.wallets WHERE user_id = req.student_id;
  IF FOUND THEN
    UPDATE public.wallets SET saldo = current_saldo + req.monto, updated_at = now() WHERE user_id = req.student_id;
  ELSE
    INSERT INTO public.wallets (user_id, saldo) VALUES (req.student_id, req.monto);
  END IF;

  INSERT INTO public.token_transactions (user_id, type, amount, description)
  VALUES (req.student_id, 'recharge', req.monto, 'Recarga vía Pago Móvil');
END;
$$;

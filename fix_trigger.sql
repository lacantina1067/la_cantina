-- Script para verificar y arreglar el trigger de creación de perfiles
-- Ejecuta esto en Supabase SQL Editor

-- 1. Primero, elimina el trigger existente si hay problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Crea la función mejorada para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar el perfil del usuario con vínculos opcionales
  INSERT INTO public.profiles (id, email, nombre, rol, parent_id, child_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario Sin Nombre'),
    COALESCE((new.raw_user_meta_data->>'rol')::app_role, 'estudiante'::app_role),
    (new.raw_user_meta_data->>'parent_id')::uuid,
    (new.raw_user_meta_data->>'child_id')::uuid
  );
  
  -- Si el rol es estudiante, crear su billetera automáticamente
  IF COALESCE((new.raw_user_meta_data->>'rol')::app_role, 'estudiante'::app_role) = 'estudiante' THEN
    INSERT INTO public.wallets (user_id, saldo)
    VALUES (new.id, 0.00);
  END IF;
  
  RETURN new;
END;
$$;

-- 3. Crea el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verifica que el trigger se creó correctamente
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 5. Verifica que la función get_my_role() existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'get_my_role';

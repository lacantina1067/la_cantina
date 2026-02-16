# Guía de Conexión a Supabase

## ✅ Estado Actual

### Ya tienes configurado:

1. ✅ **Tablas en Supabase** - profiles, wallets, products, orders, order_items
2. ✅ **Políticas RLS** - Row Level Security configurado
3. ✅ **Cliente Supabase** - `src/lib/supabase.ts`
4. ✅ **Tipos TypeScript** - `src/types/database.ts` actualizado
5. ✅ **Servicio de Auth** - `src/services/authService.ts`

### ❌ Falta:

**Agregar tus credenciales de Supabase al archivo `.env`**

## Pasos para Conectar

### 1. Obtén tus credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia:
   - **Project URL** (ejemplo: `https://abcdefgh.supabase.co`)
   - **anon public** key (la clave larga que empieza con `eyJ...`)

### 2. Configura el archivo `.env`

Abre el archivo `.env` en la raíz de tu proyecto y reemplaza con tus credenciales:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **IMPORTANTE**: Asegúrate de usar `EXPO_PUBLIC_` como prefijo para que Expo pueda acceder a estas variables.

### 3. Crea la función helper en Supabase

Tu esquema usa `public.get_my_role()` en las políticas RLS. Necesitas crear esta función en Supabase:

1. Ve a **SQL Editor** en Supabase
2. Ejecuta este código:

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
STABLE
AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid();
$$;
```

### 4. Crea el tipo ENUM para roles

Si no lo has hecho, crea el tipo `app_role`:

```sql
CREATE TYPE app_role AS ENUM ('admin', 'estudiante', 'padre');
```

### 5. Crea el tipo ENUM para estados de orden

```sql
CREATE TYPE order_status AS ENUM ('pendiente', 'aprobado_por_padre', 'rechazado_por_padre', 'completado', 'cancelado');
```

### 6. Habilita la extensión UUID (si no está habilitada)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 7. Crea un trigger para crear perfil automáticamente

Cuando un usuario se registra, automáticamente se debe crear su perfil:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre, rol)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE((new.raw_user_meta_data->>'rol')::app_role, 'estudiante')
  );
  RETURN new;
END;
$$;

-- Trigger que se ejecuta cuando se crea un usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 8. Crea un trigger para crear billetera automáticamente

Cuando se crea un perfil de estudiante, crear su billetera:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_student()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF new.rol = 'estudiante' THEN
    INSERT INTO public.wallets (user_id, saldo)
    VALUES (new.id, 0.00);
  END IF;
  RETURN new;
END;
$$;

CREATE TRIGGER on_student_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_student();
```

## Verificación

### Prueba la conexión

1. Reinicia tu servidor de desarrollo:
   ```bash
   npm start
   ```

2. Presiona `r` para recargar la app

3. Intenta registrar un nuevo usuario desde la app

4. Verifica en Supabase → **Table Editor** → **profiles** que se creó el usuario

### Prueba el login

1. Usa las credenciales del usuario que creaste
2. Deberías poder iniciar sesión y ver la pantalla correspondiente a tu rol

## Solución de Problemas

### Error: "Invalid API key"
- Verifica que copiaste correctamente la `anon public` key
- Asegúrate de que el prefijo sea `EXPO_PUBLIC_`

### Error: "Failed to fetch"
- Verifica que la URL del proyecto sea correcta
- Asegúrate de tener conexión a internet

### Error: "Row Level Security policy violation"
- Verifica que las políticas RLS estén habilitadas
- Asegúrate de que la función `get_my_role()` exista

### El perfil no se crea automáticamente
- Verifica que el trigger `on_auth_user_created` esté creado
- Revisa los logs en Supabase → **Logs**

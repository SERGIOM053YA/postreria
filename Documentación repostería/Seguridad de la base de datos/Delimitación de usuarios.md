-- 1. Crear tabla de perfiles vinculada a los usuarios de Supabase
CREATE TABLE public.perfiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  rol TEXT NOT NULL CHECK (rol IN ('Administrador', 'Cajero', 'Cocinero')) DEFAULT 'Cajero',
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Activar seguridad RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- Los empleados pueden leer la tabla (para que la app sepa qué pantalla mostrarles al iniciar sesión)
CREATE POLICY "Lectura de perfiles para staff" 
ON public.perfiles FOR SELECT 
TO authenticated USING (true);

-- 3. Trigger para automatizar la creación del perfil
CREATE OR REPLACE FUNCTION public.asignar_perfil_nuevo_usuario() 
RETURNS TRIGGER AS $$
BEGIN
  -- Todo nuevo empleado registrado entra por defecto como 'Cajero'
  INSERT INTO public.perfiles (id, rol)
  VALUES (NEW.id, 'Cajero');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Enlazar el Trigger a las altas de Supabase Auth
CREATE TRIGGER trigger_crear_perfil
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.asignar_perfil_nuevo_usuario();

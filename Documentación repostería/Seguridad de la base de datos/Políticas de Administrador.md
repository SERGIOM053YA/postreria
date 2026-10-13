Solo el administrador puede actualizar, eliminar y crear usuarios en su negocio.
-- 1. Borramos la política que causa el bucle infinito

DROP POLICY IF EXISTS "Gestión de perfiles exclusiva para administradores" ON public.perfiles;

  

-- 2. Creamos reglas separadas para evitar la recursividad

CREATE POLICY "Administradores pueden insertar"

ON public.perfiles

FOR INSERT

WITH CHECK (

  (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'Administrador'

);

  

CREATE POLICY "Administradores pueden actualizar"

ON public.perfiles

FOR UPDATE

USING (

  (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'Administrador'

);

  

CREATE POLICY "Administradores pueden borrar"

ON public.perfiles

FOR DELETE

USING (

  (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'Administrador'

);
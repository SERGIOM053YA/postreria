-- 1. Agregar la columna user_id vinculada a la autenticación de Supabase

ALTER TABLE public.pedidos

ADD COLUMN user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

  

-- 2. Actualizar las políticas RLS para usuarios autenticados (Clientes)

-- Permitir que un usuario logueado cree un pedido asegurando que el user_id sea el suyo

CREATE POLICY "Clientes autenticados crean pedidos"

ON public.pedidos

FOR INSERT

TO authenticated

WITH CHECK (auth.uid() = user_id);

  

-- Permitir que el cliente consulte únicamente su historial de pedidos

CREATE POLICY "Clientes ven sus propios pedidos"

ON public.pedidos

FOR SELECT

TO authenticated

USING (auth.uid() = user_id);
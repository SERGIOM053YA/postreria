Estas reglas evitan que personas anónimas hagan modificaciones a la base de datos 
-- 1. Activar RLS en todas las tablas
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para CATEGORÍAS y PRODUCTOS (El Catálogo)
-- Los clientes (anon) solo pueden leer (SELECT). Los dueños (authenticated) pueden hacer todo (ALL).
CREATE POLICY "Lectura publica de categorias" ON public.categorias FOR SELECT TO anon USING (true);
CREATE POLICY "CRUD dueños categorias" ON public.categorias FOR ALL TO authenticated USING (true);

CREATE POLICY "Lectura publica de productos" ON public.productos FOR SELECT TO anon USING (true);
CREATE POLICY "CRUD dueños productos" ON public.productos FOR ALL TO authenticated USING (true);

-- 3. Políticas para PEDIDOS y DETALLES (Las Comandas)
-- Los clientes (anon) solo pueden registrar nuevos pedidos (INSERT). Los dueños (authenticated) pueden gestionar todo (ALL).
CREATE POLICY "Clientes pueden crear pedidos" ON public.pedidos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "CRUD dueños pedidos" ON public.pedidos FOR ALL TO authenticated USING (true);

CREATE POLICY "Clientes pueden insertar items" ON public.pedido_items FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "CRUD dueños pedido_items" ON public.pedido_items FOR ALL TO authenticated USING (true);
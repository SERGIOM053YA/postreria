CREATE OR REPLACE VIEW reporte_corte_caja AS
SELECT 
    DATE(creado_en) as fecha,
    metodo_pago,
    COUNT(id) as total_pedidos,
    SUM(total) as ingresos_totales
FROM public.pedidos
WHERE estado != 'Cancelado' -- Ignoramos los pedidos que no se concretaron
GROUP BY DATE(creado_en), metodo_pago
ORDER BY fecha DESC;
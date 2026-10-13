
**Estatus:** 🟢 Concluido con éxito **Resumen:** Certificación de la resiliencia del sistema ante escenarios reales de compra y logística [cite: 66].

- **Tecnologías:** PL/pgSQL (Fórmula de Haversine), Leaflet.js, OpenStreetMap [cite: 66, 143].
- **Logros Clave:**
    1. **Pruebas Piloto SPEI vs. Efectivo:** Asignación automática de estado `"Por Preparar"` para Efectivo y `"Pendiente de Validación"` para SPEI [cite: 66].
    2. **Trigger** **validar_geocerca_pedido** **:** Función trigonométrica de Haversine en PostgreSQL que evalúa las coordenadas GPS y rechaza compras a domicilio superiores a **1.0 km** [cite: 66, 143].
    3. **Auditoría RLS:** Bloqueo de peticiones `PATCH`/`DELETE` anónimas y restricción de consulta para que cada cliente solo vea sus propios pedidos [cite: 66, 143].
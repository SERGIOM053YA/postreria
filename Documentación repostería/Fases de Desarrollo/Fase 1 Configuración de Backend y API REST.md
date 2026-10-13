

**Estatus:** 🟢 Concluido con éxito **Resumen:** Se estableció la infraestructura inicial de base de datos en la nube y el entorno local [cite: 11]. Se configuraron las tablas maestras `categorias` y `productos` en PostgreSQL, habilitando la regla `es_temporada` para productos especiales como el Ponche Navideño [cite: 11]. Se programaron los triggers financieros en PostgreSQL para evitar alteraciones de precios desde el navegador y se validó el ciclo CRUD completo (GET, POST, PATCH, DELETE) con Insomnia [cite: 11].

- **Tecnologías:** Supabase (PostgreSQL), Node.js (v24), Insomnia [cite: 11].
- **Entorno:** Variables `.env` aisladas (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) [cite: 11].
- **Logros Clave:**
    1. Definición de la estructura DDL para categorías y productos [cite: 11].
    2. Implementación de la tabla `pedidos` y `pedido_items` con borrado en cascada (`CASCADE`) [cite: 11].
    3. Activación de triggers anti-fraude para recálculo automático de totales [cite: 11].
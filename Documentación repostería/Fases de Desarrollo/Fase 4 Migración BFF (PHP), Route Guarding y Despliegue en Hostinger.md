
**Estatus:** 🟢 Concluido con éxito **Resumen:** Transformación de la arquitectura hacia un modelo _Backend For Frontend_ (BFF) en PHP plano, desacoplando el SDK de Supabase del navegador para permitir el alojamiento en Hostinger [cite: 67, 70].

- **Tecnologías:** PHP plano (cURL, PDO, `mail()`), Apache (Hostinger/XAMPP), SQLite [cite: 67, 70, 144].
- **Logros Clave:**
    1. **Traducción a PHP:** Enrutamiento de peticiones del frontend a través de scripts PHP (`pedidos.php`, `productos.php`, `login.php`) usando cURL [cite: 67, 70].
    2. **Route Guarding:** Escudo anti-flicker en `admin.js` para reorientar a usuarios no autorizados antes de cargar la interfaz administrativa [cite: 67].
    3. **KDS e Historial:** Visor de recibos de transferencias SPEI, calculadora de cambio en efectivo y sección "Mis Pedidos" [cite: 67].
    4. **PWA Limpia:** Eliminación del SDK de Supabase en todas las vistas HTML, convirtiendo el frontend en una aplicación ligera e independiente [cite: 67].
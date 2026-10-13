# 📚 Fuentes de Información y Referencias Técnicas

Este documento reúne las fuentes de información verídicas, estudios y documentación técnica que fundamentan la arquitectura, diseño y decisiones de negocio del **Sistema de Repostería Local (KDS + PWA)**.

---

## 1. Arquitectura y Elección Tecnológica (Modelo PWA + Jamstack a $0/mes)

### 🔹 Native vs Hybrid vs PWA Mobile Apps: Which Should You Choose?
* **Autor / Publicación:** HireFlutterDev (2026)
* **Tipo:** Artículo de Análisis Tecnológico y Comparativa Móvil
* **Uso en el Proyecto:** Justificación técnica y económica para la selección de una **Progressive Web App (PWA)**.
* **Puntos Clave:**
  * Eliminación del 100% de los costos de publicación en tiendas de aplicaciones (Apple App Store $99 USD/año y Google Play Store $25 USD).
  * Compatibilidad multiplataforma inmediata en Android (dispositivo de los dueños) e iPhone (clientes) ejecutándose desde el navegador.
  * Tiempos de respuesta de ~200 ms en carga almacenada en caché.

### 🔹 Supabase Free Tier Limits: What You Actually Get
* **Autor / Publicación:** AI Agency Plus (2026)
* **Tipo:** Reporte de Capacidad de Infraestructura Cloud
* **Uso en el Proyecto:** Sustento técnico para la adopción de **Supabase** como backend BaaS en el plan gratuito ($0.00 USD/mes).
* **Puntos Clave:**
  * Base de Datos PostgreSQL dedicada de 500 MB (capacidad para más de 50,000 pedidos en texto plano).
  * Gestión de Autenticación de hasta 50,000 Usuarios Activos Mensuales (MAU).
  * Canal WebSockets (`supabase_realtime`) con capacidad de 200 conexiones simultáneas y 2,000,000 de mensajes/mes para el monitor KDS en cocina.
  * Almacenamiento de imágenes de 1 GB (bucket `menu-imagenes`).

---

## 2. Normativa, Seguridad Alimentaria y Logística Hiperlocal

### 🔹 Seguridad alimentaria en el delivery: ¿qué riesgos existen en la comida a domicilio?
* **Autor / Publicación:** CSA Consultores (2025)
* **Tipo:** Norma y Estudio de Calidad Microbiológica
* **Uso en el Proyecto:** Fundamentación de la regla de negocio para entregas hiperlocales a pie limitadas strictly a **1.0 km (1,000 metros)**.
* **Puntos Clave:**
  * Mantenimiento de la cadena de frío (temperaturas <= 5 °C) para evitar la proliferación de bacterias en postres fríos.
  * Garantía de tiempos de traslado inferiores a 15 minutos a pie.
  * Reducción drástica de mermas y pérdidas por productos dañados o derretidos.

### 🔹 Trigonometría Esférica y Geodesia (Fórmula de Haversine)
* **Tipo:** Modelo Algorítmico Matemático
* **Uso en el Proyecto:** Geocercado (Geofencing) nativo implementado en JavaScript (Frontend) y en un Trigger de PostgreSQL (Backend).
* **Puntos Clave:**
  * Cálculo de distancia en línea recta sobre la superficie terrestre entre las coordenadas de la tienda y las del cliente.
  * Operación nativa a costo $0.00 USD sin requerir suscripciones a APIs pagadas de mapas.

---

## 3. Investigaciones de Mercado y Evaluación de Pasarelas

### 🔹 Research report: Tecnologías y Viabilidad Repostería
* **Tipo:** Informe Interno de Viabilidad
* **Uso en el Proyecto:** Diagnóstico inicial del problema operativo.
* **Puntos Clave:**
  * Reemplazo de la atención informal por WhatsApp/teléfono por un panel KDS organizado.
  * Eliminación de comisiones de intermediarios mediante cobros directos en Efectivo y SPEI.

### 🔹 Documentación Oficial de Mercado Pago Developers
* **Uso en el Proyecto:** Evaluación comparativa que llevó a la decisión estratégica de **descartar pasarelas externas**, evitando comisiones por transacción y reteniendo el 100% del margen del comercio.

---

## 4. Documentación Oficial de Frameworks y Herramientas

- **Supabase Docs:** PostgreSQL, Auth, Realtime y RLS.
- **PHP Manual:** cURL y PDO SQLite.
- **Leaflet.js / OpenStreetMap API:** Mapeo y Geolocalización.
- **PostgreSQL Docs:** PL/pgSQL y Triggers.

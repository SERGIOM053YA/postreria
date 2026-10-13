# 🚀 Backend API - Sistema de Repostería (KDS)

Este repositorio contiene la arquitectura de la Fase 1 (MVP) del backend para el sistema de punto de venta y KDS de la repostería, construido sobre **Supabase (PostgreSQL)**.

## 🏗️ Arquitectura de Base de Datos

El sistema opera con 4 tablas principales con integridad referencial:

1. **`categorias`**: Clasificación del menú (Postres, Bebidas, etc.).
2. **`productos`**: Catálogo oficial con precios. *Nota: No se pueden eliminar si tienen pedidos asociados (Regla RESTRICT).*
3. **`pedidos`**: Tabla maestra de comandas. Guarda el estado del pedido, los datos del cliente que aplican al momento de la compra (Snapshot) y se vincula automáticamente al `user_id` de la sesión.
4. **`pedido_items`**: Desglose de cada orden. Vincula el pedido con el producto y congela el precio de venta.

## 🔐 Seguridad y Autenticación (RLS)

Toda la base de datos está protegida con **Row Level Security (RLS)**:
- **Clientes (Anon / Autenticados básicos):** Solo pueden leer el catálogo (`categorias` y `productos`) y crear nuevos pedidos (`INSERT`). **No pueden borrar ni modificar el historial**.
- **Administradores (Dueños):** Tienen control total (CRUD) para gestionar el menú y cambiar los estados de los pedidos enviando su token JWT.

## ⚙️ Triggers Anti-Fraude (¡IMPORTANTE PARA EL FRONTEND!)

Para proteger las finanzas, el cálculo matemático se delega al servidor. El flujo de compra desde el frontend debe ser el siguiente:
1. El Frontend envía el `POST` a `pedidos` con los datos del cliente (nombre, teléfono extraídos de su sesión) y un `"total"` preliminar.
2. El Frontend envía el `POST` a `pedido_items` con los productos de esa orden.
3. **La magia del Backend:** 
   - Un Trigger intercepta los ítems y sobreescribe cualquier precio unitario enviado desde el frontend con el precio oficial de la tabla `productos`.
   - Otro Trigger multiplica y suma las cantidades exactas y actualiza automáticamente el campo `"total"` de la tabla `pedidos`.
*Conclusión para Frontend: Confíen en la base de datos. El servidor siempre tendrá la última palabra y corregirá cualquier error de cálculo o manipulación.*

## 🔌 Conexión en Tiempo Real (KDS)

El canal `supabase_realtime` está encendido. La pantalla de la cocina (KDS) debe suscribirse a la tabla `pedidos` vía WebSockets para reaccionar al instante cuando un cliente ingrese un pedido nuevo.

## 🛠️ Variables de Entorno Necesarias

Para conectar el proyecto (React/Angular) a este backend, agreguen las siguientes credenciales en su archivo `.env`:

```env
VITE_SUPABASE_URL=https://abwqlettqauklpufupaa.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8
```

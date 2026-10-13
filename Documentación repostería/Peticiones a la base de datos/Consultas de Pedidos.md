# 📡 Documentación API: Tabla de Pedidos

**Headers obligatorios para TODAS las peticiones (Seguridad):**
* `apikey`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8
* `Authorization`: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8

## 1. Lecturas del Historial (GET)
* **Obtener todos:** URL `https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedidos?select=*`. Extrae la lista de todas las comandas; devuelve un `200 OK`.
* **Obtener por ID:** URL `https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedidos?id=eq.[ID]`. Trae la información de una orden específica; devuelve un `200 OK`.

## 2. Creación y Modificación (POST / PATCH)
* **Registrar un Pedido (POST):** URL `https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedidos`. Requiere el header `Prefer: return=representation`.
  * *Regla:* Los pagos SPEI (transferencias) se registran en estado `"Pendiente de Validación"`. Los pagos en efectivo entran directamente como `"Por Preparar"`
  * *JSON Body:* Envía `cliente_nombre`, `cliente_telefono`, `tipo_entrega`, `metodo_pago`, `estado` y `total`. Devuelve un `201 Created`.
* **Modificar Estado (PATCH):** URL `https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedidos?id=eq.[ID]`. Útil para que los administradores avancen el pedido a `"En Preparación"` tras confirmar los fondos[cite: 2].
  * *JSON Body:* Solo se envía el campo a modificar (ej. `{"estado": "En Preparación"}`). Devuelve un `200 OK`.

## 3. Borrado de Órdenes (DELETE)
* **Eliminar Pedido (DELETE):** URL `https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedidos?id=eq.[ID]`.
* **Comportamiento:** Al borrar un pedido, la regla `CASCADE` de la base de datos eliminará en automático todos los productos asociados a esa orden en la tabla `pedido_items`.
* **Respuesta Esperada:** `204 No Content` (Sin body enviado ni recibido).
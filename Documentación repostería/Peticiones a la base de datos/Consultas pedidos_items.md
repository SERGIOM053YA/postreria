
# 📡 Documentación API: Detalles de Pedido (`pedido_items`)

**Headers obligatorios para TODAS las peticiones (Seguridad):**

* `apikey`: eyJhbGciOpair-blank_0c8ec5c0c9e64c61a18619ee42ae11b8iJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8
* `Authorization`: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8]

### 1. Obtener todos los detalles (GET)

- **URL:** `[https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items?select=](https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items?select=)*`
    
- **Descripción:** Extrae todos los registros de la tabla.
    
- **Respuesta Esperada:** `200 OK` (Arreglo JSON).
    

### 2. Obtener los productos de un pedido específico (GET)

- **URL:** `[https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items?pedido_id=eq](https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items?pedido_id=eq).[ID_DEL_PEDIDO]`
    
- **Descripción:** Endpoint vital para el frontend. Trae únicamente los postres que pertenecen a una comanda específica para mostrar el desglose.
    
- **Respuesta Esperada:** `200 OK` (Arreglo JSON).
    

### 3. Registrar productos en el pedido (POST - Carga Masiva)

- **URL:** `[https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items](https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items)`
    
- **Header extra:** `Prefer: return=representation`
    
- **Descripción:** Inserta uno o varios productos a un pedido (Bulk Insert).
    
- **Body (JSON):**
    

JSON

```
[
  {
    "pedido_id": 1,
    "producto_id": 8, 
    "cantidad": 2,
    "precio_unitario": 40.00
  },
  {
    "pedido_id": 1,
    "producto_id": 26,
    "cantidad": 1,
    "precio_unitario": 45.00
  }
]
```

- **Respuesta Esperada:** `201 Created`
    

### 4. Modificar un registro (PATCH)

- **URL:** `[https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items?id=eq](https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items?id=eq).[ID_DEL_ITEM]`
    
- **Header extra:** `Prefer: return=representation`
    
- **Descripción:** Actualiza la cantidad o el precio de un ítem específico.
    
- **Body (JSON):**
    

JSON

```
{
  "cantidad": 3
}
```

- **Respuesta Esperada:** `200 OK`
    

### 5. Eliminar un postre del pedido (DELETE)

- **URL:** `[https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items?id=eq](https://abwqlettqauklpufupaa.supabase.co/rest/v1/pedido_items?id=eq).[ID_DEL_ITEM]`
    
- **Descripción:** Borra un ítem individual de la orden sin afectar el resto de la comanda.
    
- **Respuesta Esperada:** `204 No Content`
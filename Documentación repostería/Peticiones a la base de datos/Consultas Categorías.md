# 📡 Documentación API: Categorías (CRUD)

**Headers obligatorios para TODAS las peticiones (Seguridad):**
* `apikey`: eyJhbGciOpair-blank_0c8ec5c0c9e64c61a18619ee42ae11b8iJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8
* `Authorization`: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8

---
  
### 1. Obtener Todas las Categorías (GET)
* **URL:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/categorias?select=*`
* **Descripción:** Extrae la lista completa para armar las pestañas de navegación en el frontend.
* **Respuesta Esperada:** `200 OK` (Arreglo JSON).

### 2. Obtener una Categoría por ID (GET)
* **URL:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/categorias?id=eq.[ID]`
  *(Ejemplo: `.../categorias?id=eq.1`)*
* **Descripción:** Trae los datos de una categoría específica.
* **Respuesta Esperada:** `200 OK` (Arreglo JSON con un solo objeto).

### 3. Crear Categoría (POST)
* **URL:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/categorias`
* **Header extra:** `Prefer` = `return=representation`
* **Descripción:** Registra una nueva categoría en la base de datos.
* **Body (JSON):**
```json
{
  "nombre": "Alitas y Boneless"
}
```
* **Respuesta Esperada:** `201 Created`

### 4. Modificar Categoría (PATCH)
* **URL:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/categorias?id=eq.[ID]`
  *(Ejemplo: `.../categorias?id=eq.4`)*
* **Header extra:** `Prefer` = `return=representation`
* **Descripción:** Útil para corregir errores ortográficos en el nombre sin afectar los productos asociados.
* **Body (JSON):**
```json
{
  "nombre": "Alitas & Boneless"
}
```
* **Respuesta Esperada:** `200 OK`

### 5. Eliminar Categoría (DELETE)
* **URL:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/categorias?id=eq.[ID]`
  *(Ejemplo: `.../categorias?id=eq.4`)*
* **Descripción:** Borra la categoría. (Fallará automáticamente con código de error si tiene productos vinculados, gracias a la regla RESTRICT de la base de datos).
* **Body:** Ninguno (No Body).
* **Respuesta Esperada:** `204 No Content`
### 1. Obtener Catálogo Completo (GET)
**Headers obligatorios para TODAS las peticiones (Seguridad):**
* `apikey`: eyJhbGciOpair-blank_0c8ec5c0c9e64c61a18619ee42ae11b8iJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8
* `Authorization`: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8]

- **URL Exacta:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/productos?select=*`
    
- **Descripción:** Trae todos los productos registrados en la tabla.
    
- **Respuesta Esperada:** `200 OK` (Arreglo JSON con productos).
    

### 2. Registrar un Nuevo Producto (POST)

- **URL Exacta:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/productos`
    
- **Header extra:** `Prefer` = `return=representation`
    
- **Body (JSON):**
    
    JSON
    
    ```
    {
      "nombre": "Rebanada de imposible",
      "precio": 35.00,
      "descripcion": "Clásico pastel imposible con flan y pan de chocolate.",
      "es_temporada": false,
      "imagen_url": null
    }
    ```
    
- **Respuesta Esperada:** `201 Created`
    

### 3. Actualizar Parcialmente (PATCH)

- **URL Exacta:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/productos?id=eq.[ID_DEL_PRODUCTO]`
    
    _(Ejemplo probado: `https://abwqlettqauklpufupaa.supabase.co/rest/v1/productos?id=eq.6`)_
    
- **Header extra:** `Prefer` = `return=representation`
    
- **Descripción:** Modifica únicamente los campos enviados (ej. para subir foto después).
    
- **Body (JSON):**
    
    JSON (Ejemplo)
    
    ```
    {
      "imagen_url": "[https://ejemplo.com/rebanada_imposible.jpg](https://ejemplo.com/rebanada_imposible.jpg)"
    }
    ```
    
- **Respuesta Esperada:** `200 OK`
    

### 4. Eliminar Producto (DELETE)

- **URL Exacta:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/productos?id=eq.[ID_DEL_PRODUCTO]`
    
    _(Ejemplo probado: `https://abwqlettqauklpufupaa.supabase.co/rest/v1/productos?id=eq.6`)_
    
- **Body:** Ninguno (No Body).
    
- **Respuesta Esperada:** `204 No Content`
    

## 📝 Notas de Arquitectura y Desarrollo

- **Seguridad (RLS):** Las políticas de Seguridad a Nivel de Fila (RLS) en Supabase están temporalmente desactivadas para facilitar el desarrollo local.
    
- **Gestión de Imágenes:** Para evitar saturar el límite de 500 MB de la base de datos gratuita, las imágenes no se guardan como archivos binarios en SQL. Se admiten valores `null` en la tabla temporalmente; los archivos comprimidos en WebP se subirán al Storage de Supabase (1 GB disponible) y solo se almacenará la URL final.
    
- **Troubleshooting Red:** Si Node.js lanza error `fetch failed` por conflictos de IPv6 en el proveedor de internet, ejecutar los scripts locales forzando IPv4 con el comando: 
- `node --dns-result-order=ipv4first testConnection.js`.
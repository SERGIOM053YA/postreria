## 2. Documentación API (Insomnia)

**Headers obligatorios para TODAS las peticiones:**

* `apikey`: eyJhbGciOpair-blank_0c8ec5c0c9e64c61a18619ee42ae11b8iJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8
* `Authorization`: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFid3FsZXR0cWF1a2xwdWZ1cGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDgwOTYsImV4cCI6MjEwNDk4NDA5Nn0.5rpXHPuWskz9jm1GrbyEdXXgTbaQF1mmg7shpMqvZa8

    

### Asignar un Rol a un Empleado (POST)

- **URL:** `[https://abwqlettqauklpufupaa.supabase.co/rest/v1/perfiles](https://abwqlettqauklpufupaa.supabase.co/rest/v1/perfiles)`
    
- **Header extra:** `Prefer` = `return=representation`
    
- **Descripción:** Otorga un nivel de acceso a un usuario previamente registrado.
    
- **Body (JSON):**
    

JSON

```
{
  "id": "AQUI_VA_EL_UUID_DEL_EMPLEADO",
  "rol": "Cocinero"
}
```

- **Respuesta Esperada:** `201 Created`
    

### Obtener Perfiles del Equipo (GET)

- **URL:** `[https://abwqlettqauklpufupaa.supabase.co/rest/v1/perfiles?select=](https://abwqlettqauklpufupaa.supabase.co/rest/v1/perfiles?select=)*`
    
- **Descripción:** Lista los empleados y sus roles actuales.
    
- **Respuesta Esperada:** `200 OK`
    

### Modificar el Rol de un Empleado (PATCH)

- **URL:** `[https://abwqlettqauklpufupaa.supabase.co/rest/v1/perfiles?id=eq](https://abwqlettqauklpufupaa.supabase.co/rest/v1/perfiles?id=eq).[UUID_DEL_EMPLEADO]`
    
- **Header extra:** `Prefer` = `return=representation`
    
- **Body (JSON):**
    

JSON

```
{
  "rol": "Administrador"
}
```

- **Respuesta Esperada:** `200 OK`
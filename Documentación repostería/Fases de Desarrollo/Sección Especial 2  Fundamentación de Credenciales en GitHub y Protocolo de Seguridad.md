### **2.1 Justificación del Entorno de Laboratorio / Pruebas**

Durante las primeras fases de integración, se subieron credenciales de acceso (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `EMAIL_USER`, `EMAIL_PASS`) al repositorio de GitHub [cite: 60, 61]. Esto quedó fundamentado bajo las siguientes condiciones de desarrollo:

- **Base de Datos de Laboratorio (Sandbox/Staging):** Las llaves publicadas correspondían a un entorno de pruebas independiente utilizado exclusivamente para la validación de scripts, Insomnia y simulaciones E2E [cite: 106, 207].
- **Ausencia de Datos de Producción:** El entorno de laboratorio no contenía información bancaria real, clientes verídicos ni datos sensibles de la empresa (únicamente el catálogo base) [cite: 106, 207].
- **Llaves Públicas por Diseño:** La clave `SUPABASE_ANON_KEY` está diseñada para ser expuesta en clientes web, ya que la verdadera seguridad relacional reside en las políticas RLS activas en PostgreSQL [cite: 5, 62].

### **2.2 Protocolo de Seguridad y Mitigación Aplicado**

Para preparar el paso a producción y evitar la exposición de credenciales en el repositorio, se ejecutó un protocolo estricto de saneamiento [cite: 60, 61, 67]:

1. **Rotación Inmediata de Credenciales:**

- Se revocó y regeneró la contraseña de aplicación de Google (`EMAIL_PASS`) [cite: 61, 62].
- Se cambió la clave secreta de tokens (`JWT_SECRET`), invalidando cualquier token emitido previamente en el entorno de pruebas [cite: 61, 62].

2. **Creación de la Bóveda Privada (** **api/config.php** **):**

- Se reemplazó el archivo `.env` por un archivo `config.php` que retorna un arreglo privado [cite: 58, 59].
- **Propiedad de Seguridad:** Si un tercero intenta acceder mediante una URL directa (`[suspicious link removed]`), el motor PHP procesa el script sin imprimir salida, devolviendo una **pantalla en blanco** [cite: 58, 59].

3. **Protección en Git (** **.gitignore** **y Plantilla** **config.example.php** **):**

- Se agregó `api/config.php` al archivo `.gitignore` y se eliminó de la memoria caché de Git con `git rm --cached api/config.php` [cite: 60].
- Se subió al repositorio el archivo **config.example.php** con valores neutros de plantilla para que otros desarrolladores puedan configurar su entorno local sin exponer las claves reales [cite: 60].
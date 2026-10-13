### **1.1 El Prototipo Inicial (Node.js + Express + SQLite)**

En una etapa intermedia del desarrollo, se construyó un servidor intermediario en **Node.js con Express y SQLite** (`respaldo_emergencia.db`) [cite: 19, 21]. Su objetivo inicial era funcionar como un _paracaídas de emergencia_: si la conexión hacia la nube de Supabase fallaba, el servidor interceptaba la petición, autenticaba localmente con SQLite y guardaba los pedidos en una tabla local [cite: 19, 21, 23].

### **1.2 Razones Técnicas del Descarte de Node.js**

Durante la etapa de preparación para el despliegue, el entorno de alojamiento asignado por la empresa fue **Hostinger (Alojamiento Compartido / Shared Hosting bajo Apache)** [cite: 29, 70]. Esto presentó las siguientes limitaciones:

- **Falta de Demonios/Procesos Continuos:** Los entornos de hosting compartido como Hostinger no soportan la ejecución permanente de entornos de ejecución como Node.js (`npm start`, `pm2` o procesos escuchando continuamente en puertos personalizados como el `:3000`) sin contratar servidores VPS dedicados [cite: 70, 144].
- **Incompatibilidad de Puertos Directos:** Intentar conectar el frontend estático a un puerto dinámico de Node.js causaba bloqueos de red (`ERR_CONNECTION_REFUSED`) y problemas de CORS al ejecutarse en un servidor Apache tradicional [cite: 25, 141].

### **1.3 Fundamentación de la Elección de PHP Plano (BFF)**

Para mantener la arquitectura del **Servidor Intermediario (BFF)** y garantizar una infraestructura de **$0.00 USD/mes**, se decidió migrar la lógica del servidor a **PHP plano (estructurado)** por las siguientes ventajas [cite: 29, 70, 144]:

1. **Compatibilidad Nativa con Hostinger:** PHP se ejecuta de forma nativa en el servidor Apache de Hostinger sin requerir procesos en segundo plano ni configuraciones avanzadas de servidor [cite: 70, 144].
2. **Consumo por cURL:** PHP realiza las llamadas a la API REST de Supabase mediante extensiones cURL en el lado del servidor, ocultando las credenciales de la vista del cliente [cite: 30, 70, 144].
3. **Resiliencia con PDO SQLite:** PHP incluye la librería PDO de forma predeterminada, lo que permitió conservar el archivo de respaldo `respaldo_emergencia.db` para conmutación por error (_failover_) sin agregar dependencias externas [cite: 30, 70, 144].
4. **Enrutamiento Agnóstico:** Al cambiar las rutas absolutas (`http://localhost:3000/api/...`) por rutas relativas (`../api/pedidos.php`), la aplicación PWA funciona exactamente igual en el entorno local (XAMPP) que en el dominio de producción de Hostinger [cite: 29, 30].
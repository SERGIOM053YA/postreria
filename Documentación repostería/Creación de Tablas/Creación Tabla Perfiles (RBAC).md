La tabla `perfiles` gestiona los permisos del equipo del negocio (Control de Acceso Basado en Roles). Se vincula directamente con la tabla interna de autenticación de Supabase (`auth.users`).

## 1. Estructura de la Tabla `public.perfiles`

|**Columna**|**Tipo de Dato**|**Restricciones**|**Descripción**|
|---|---|---|---|
|`id`|`uuid`|Primary Key, Foreign Key|Debe ser exactamente el mismo ID del usuario registrado en Autenticación.|
|`rol`|`text`|Check|Solo acepta: `'Administrador'`, `'Cocinero'` o `'Cajero'`.|
|`creado_en`|`timestamp`|Default: `now()`|
Se configuró la tabla principal del catálogo mediante el _Table Editor_ de Supabase.

**Tabla:** `public.productos`

| **Columna**    | **Tipo de Dato** | **Restricciones / Configuración** | **Descripción**                                                                                                                                                |
| -------------- | ---------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `int8` (bigint)  | Primary Key, Auto-incrementable   | Identificador único del producto.                                                                                                                              |
| `nombre`       | `text`           | Not Null                          | Nombre comercial del postre.                                                                                                                                   |
| `precio`       | `numeric`        | Not Null                          | Precio unitario del producto.                                                                                                                                  |
| `descripcion`  | `text`           | Not Null                          | Detalles e ingredientes del producto.                                                                                                                          |
| `es_temporada` | `boolean`        | Not Null (Default: false)         | Interruptor algorítmico para habilitar productos específicos por época (ej. Ponche Navideño en diciembre) sin alterar la carta base el resto del año[cite: 3]. |
| `imagen_url`   | `text`           | Nullable (Acepta n                |                                                                                                                                                                |

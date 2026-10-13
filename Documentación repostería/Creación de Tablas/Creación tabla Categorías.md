# 🗄️ Estructura: Tabla Categorías y Relación Foránea

## 1. Tabla: `public.categorias`
Esta tabla actúa como el catálogo maestro para agrupar los platillos y mostrar un menú ordenado en el frontend.

| Columna  | Tipo de Dato    | Restricciones               | Descripción                                          |
| :------- | :-------------- | :-------------------------- | :--------------------------------------------------- |
| `id`     | `int8` (bigint) | Primary Key, Auto-increment | Identificador único de la categoría.                 |
| `nombre` | `text`          | Not Null, Unique            | Nombre de la sección (ej. Postres, Snacks, Bebidas). |

## 2. Actualización: Tabla `public.productos`
Se añadió una llave foránea para vincular cada producto a una categoría específica.

| Columna Nueva  | Tipo de Dato    | Relación (Foreign Key)   |
| :------------- | :-------------- | :----------------------- |
| `categoria_id` | `int8` (bigint) | Apunta a `categorias.id` |

### 🛡️ Lógica de la Llave Foránea (Foreign Key)
* **Acción configurada:** `RESTRICT` (o `NO ACTION`).
* **Justificación Arquitectónica:** Si un administrador intenta eliminar la categoría "Snacks" y aún hay productos como "Esquites" asignados a ella, la base de datos bloqueará la eliminación y lanzará un error. Esto protege la integridad del menú y evita que los platillos queden huérfanos o desaparezcan del catálogo interactivo por un error humano.
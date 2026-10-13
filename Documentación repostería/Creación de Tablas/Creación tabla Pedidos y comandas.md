# 🗄️ Estructura: Tablas de Pedidos y Comandas (KDS)

El sistema de comandas es el núcleo del flujo operativo (Kanban) en la cocina. Se divide en dos tablas relacionales para mantener la normalización de la base de datos y cumplir con el Protocolo Anti-Fraude (RF-05)[cite: 2].

## 1. Tabla Principal: `public.pedidos`
Almacena los datos del cliente, el total financiero y el estado logístico de la comanda.

| Columna            | Tipo de Dato    | Restricciones               | Descripción                                       |
| :----------------- | :-------------- | :-------------------------- | :------------------------------------------------ |
| `id`               | `int8` (bigint) | Primary Key, Auto-increment | Número de folio de la orden (ej. Pedido #105).    |
| `cliente_nombre`   | `text`          | Not Null                    | Nombre de quien recibe.                           |
| `cliente_telefono` | `text`          | Not Null                    | WhatsApp o teléfono de contacto.                  |
| `tipo_entrega`     | `text`          | Not Null                    | 'Recoger en Local' o 'A Domicilio'[cite: 2].      |
| `metodo_pago`      | `text`          | Not Null                    | 'Efectivo' o 'Transferencia SPEI'[cite: 2].       |
| `estado`           | `text`          | Not Null                    | Estado de la máquina de flujo (Ver reglas abajo). |
| `total`            | `numeric`       | Not Null                    | Monto total a cobrar.                             |
| `creado_en`        | `timestamp`     | Default: `now()`            | Fecha y hora exacta en la que entró el pedido.    |

### 🚦 Máquina de Estados (Columna `estado`)
La aplicación frontend enviará el estado inicial basándose en el método de pago seleccionado por el cliente:
*   **`Pendiente de Validación`**: Estado automático si el cliente elige Transferencia SPEI. Bloquea la orden para que no pase a cocina hasta que el dueño confirme el depósito en su app bancaria.
*   **`Por Preparar`**: Estado automático si el cliente elige Efectivo. Aparece instantáneamente en la pantalla de la cocina (KDS).
*   **`En Preparación`**: Estado manual asignado por el dueño al iniciar la elaboración del postre.
*   **`Listo / Entregado`**: Cierre del ciclo operativo.

---

## 2. Tabla de Detalles: `public.pedido_items`
Desglosa el contenido exacto del carrito de compras de cada cliente. 

| Columna           | Tipo de Dato | Relación (Foreign Key)      | Descripción                                 |
| :---------------- | :----------- | :-------------------------- | :------------------------------------------ |
| `id`              | `int8`       | Primary Key, Auto-increment | Identificador de esta fila.                 |
| `pedido_id`       | `int8`       | Apunta a `pedidos.id`       | Vincula el postre con la orden del cliente. |
| `producto_id`     | `int8`       | Apunta a `productos.id`     | Vincula con el catálogo real del negocio.   |
| `cantidad`        | `int2`       | Not Null (Mínimo 1)         | Número de porciones solicitadas.            |
| `precio_unitario` | `numeric`    | Not Null                    | Precio "congelado" al momento de la compra. |

### 🛡️ Lógica de Llaves Foráneas en los Detalles
*   **`pedido_id` (Acción: CASCADE):** Si por alguna razón el administrador cancela y borra un pedido completo, todos los platillos asociados a ese pedido se borrarán automáticamente de esta tabla.
*   **`producto_id` (Acción: RESTRICT):** Si un pedido tiene "Esquites", el sistema bloqueará que alguien borre los "Esquites" del menú principal para conservar el historial financiero intacto.
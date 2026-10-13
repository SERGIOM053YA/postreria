# 🗄️ Estructura: Detalles de Pedido (`pedido_items`)

Esta tabla almacena el desglose exacto de cada comanda. Mantiene los precios congelados al momento de la compra y se vincula de forma relacional con el catálogo y el pedido principal.

## Estructura de la Tabla (`public.pedido_items`)

|**Columna**|**Tipo de Dato**|**Restricciones / Relación**|**Descripción**|
|---|---|---|---|
|`id`|`int8` (bigint)|Primary Key, Auto-increment|Identificador único de este registro.|
|`pedido_id`|`int8`|FK -> `pedidos.id` (CASCADE)|Vincula el postre con la orden del cliente. Si se borra el pedido, se borran sus ítems automáticamente.|
|`producto_id`|`int8`|FK -> `productos.id` (RESTRICT)|Protege el historial: no se puede borrar un postre del menú si ya está registrado en un pedido.|
|`cantidad`|`int2`|Not Null (Mínimo 1)|Número de porciones solicitadas del producto.|
|`precio_unitario`|`numeric`|Not Null|Precio guardado al momento de la compra para evitar variaciones financieras a futuro.|
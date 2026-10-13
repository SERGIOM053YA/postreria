# 🔒 Aviso de Privacidad y Términos de Servicio

**Fecha de última actualización:** 21 de Septiembre de 2026  
**Sistema:** Plataforma Web / PWA de Pedidos de Repostería Local  
**Responsables del Tratamiento:** Dueños y Operadores del Establecimiento de Repostería Artesanal  

---

## 1. Identidad y Domicilio del Responsable
El presente documento constituye el Aviso de Privacidad integral de conformidad con la legislación aplicable en materia de protección de datos personales. El comercio opera como un establecimiento hiperlocal de repostería artesanal, siendo los propietarios directos los únicos responsables del uso, resguardo y protección de la información recabada.

---

## 2. Datos Personales Recabados
Para la prestación del servicio de pedidos en línea, despacho en mostrador y entregas locales, el sistema recopila exclusivamente los siguientes datos:

* **Datos de Identificación y Registro:** Nombre completo, dirección de correo electrónico y contraseña encriptada (administrada vía Supabase Auth).
* **Datos de Contacto:** Número de teléfono móvil / WhatsApp para notificaciones sobre el estado de la comanda.
* **Datos de Ubicación y Entrega:** Dirección física y coordenadas geográficas (latitud y longitud obtenidas mediante el pin en el mapa interactivo de Leaflet/OpenStreetMap).
* **Datos Operativos de la Transacción:** Desglose de postres solicitados, método de pago seleccionado (Efectivo o Transferencia SPEI) y montos totales.

> **Aviso sobre Datos Financieros Sensibles:** El sistema **no** recopila, procesa ni almacena números de tarjetas de crédito o débito, códigos de seguridad (CVV) ni credenciales bancarias. Todas las operaciones financieras se liquidan directamente en efectivo o mediante transferencias electrónicas entre cuentas bancarias gestionadas por las aplicaciones oficiales de los clientes y los propietarios.

---

## 3. Finalidades del Tratamiento de Datos
Los datos personales proporcionados serán utilizados estrictamente para las siguientes finalidades necesarias:

1. **Gestión Operativa de Comandas:** Registrar, preparar y empaquetar los pedidos en la cocina mediante la comanda digital (KDS).
2. **Validación Geográfica del Servicio (Geocerca):** Verificar mediante la fórmula de Haversine que la dirección de entrega se encuentre dentro del radio máximo de cobertura operativa (≤ 1.0 km / 1,000 metros a pie).
3. **Control y Validación Anti-Fraude:** Conciliar las transferencias electrónicas registradas contra los ingresos efectivos en las cuentas de los dueños antes de proceder con la elaboración de productos perecederos.
4. **Historial de Usuario:** Permitir a los clientes registrados consultar sus órdenes previas y mantener la trazabilidad de sus consumos de forma aislada y confidencial.

---

## 4. Política de Anticipos y No Devolución (Productos Perecederos)
En apego a la naturaleza artesanal y perecedera de los insumos de repostería (cremas, frutas, mantecas y decoraciones personalizadas):

* **Carácter No Reembolsable:** Al confirmar un pedido con pago anticipado o total, el cliente reconoce y acepta expresamente que los montos cubren costos de insumos ya reservados y tiempos de mano de obra asignados, por lo que **no se admiten cancelaciones, reembolsos monetarios ni devoluciones una vez que la orden ha ingresado al estado "En Preparación"**.
* **Condición de Preparación:** Ningún pedido con modalidad de transferencia SPEI será elaborado hasta que el saldo se encuentre debidamente reflejado y validado en la cuenta bancaria receptora.

---

## 5. Medidas de Seguridad y Transferencia de Datos
* **Seguridad en Servidores y Bases de Datos:** La información se almacena en bases de datos relacionales PostgreSQL protegidas mediante mecanismos de Seguridad a Nivel de Fila (RLS). Los clientes solo tienen visibilidad de sus propios datos, impidiendo el acceso a órdenes de terceros.
* **Cero Transferencia a Terceros:** Los datos personales no son comercializados, cedidos, transferidos ni compartidos con empresas de publicidad ni intermediarios externos.

---

## 6. Derechos de Acceso, Rectificación, Cancelación y Oposición (ARCO)
Los usuarios tienen derecho en todo momento a acceder a sus datos personales, solicitar su corrección si están desactualizados, pedir la eliminación de su cuenta o revocar el consentimiento otorgado. Dichas solicitudes pueden formularse directamente a través de los canales de atención del establecimiento o mediante los mecanismos de administración de perfil dentro de la aplicación web.
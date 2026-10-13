# 📈 Gestión de Proyectos: Evolución de Waterfall a Metodología Ágil

## 📌 Resumen Ejecutivo
El desarrollo del **Sistema de Ventas y Comandas (KDS) para la Repostería** experimentó una evolución en su marco de gestión. Inicialmente concebido bajo un enfoque tradicional **Waterfall (Cascada)** con fases secuenciales rígidas, el proyecto pivotó hacia un marco **Ágil (Agile / Kanban-Scrum híbrido)** debido a los ajustes continuos en la arquitectura, requisitos operativos del cliente y restricciones de infraestructura en la nube y hospedaje.

---

## 🌊 1. Enfoque Inicial: Modelo Waterfall (Cascada)

### 1.1 Premisa Original
En las primeras etapas de planificación, se contempló un ciclo de vida en cascada dividido en etapas secuenciales no iterativas:
1. **Análisis de Requisitos:** Definición cerrada de productos, pasarela de pago (Mercado Pago) e infraestructura.
2. **Diseño del Sistema:** Arquitectura inicial en Node.js/Express con SQLite y esquemas fijos.
3. **Desarrollo:** Codificación completa del frontend y backend de forma aislada.
4. **Pruebas Integrales:** Certificación final antes del despliegue.
5. **Despliegue:** Salida a producción en servidor dedicado.

### 1.2 Razones del Descarte de Waterfall
Durante las primeras semanas de ejecución se identificaron factores críticos que hicieron inviable el modelo en cascada:
* **Cambios de Requisitos de Negocio:** El cliente (dueños de la repostería) solicitó eliminar las pasarelas de pago externas (Mercado Pago) para evitar comisiones por transacción y optar por cobros directos (**Efectivo y SPEI con validación manual**).
* **Restricciones de Infraestructura:** El servidor de alojamiento asignado (**Hostinger Compartido**) impidió la ejecución continua de demonios Node.js, exigiendo una reestructuración hacia **PHP plano (BFF)**.
* **Ajustes de Logística en Tiempo Real:** Se incorporó el candado trigonométrico de **Haversine (≤ 1.0 km a pie)** para proteger la cadena de frío y mitigar mermas por productos dañados, requisito no contemplado en la fase inicial.

---

## 🚀 2. Transición e Implementación de la Metodología Ágil (Agile)

### 2.1 Marco Adoptado (Kanban & Sprints Cortos)
Se adoptó un modelo **Ágil Híbrido** basado en iteraciones cortas, retroalimentación continua (*Feedback Loops*) y gestión visual del trabajo mediante tableros Kanban.



### 2.2 Desglose de Iteraciones (Sprints / Fases)

| Fase / Sprint | Enfoque Principal | Entregables Clave |
| :--- | :--- | :--- |
| **Fase 1: MVP & DB** | Base de Datos Relacional | Tablas , , ,  en Supabase; Triggers anti-fraude financieros; Pruebas CRUD en Insomnia. |
| **Fase 2: Seguridad & KDS** | Roles, Archivos y Realtime | Bucket , tabla  con RLS, vista  y canal WebSockets para el KDS de cocina. |
| **Fase 3: Logística E2E** | Geocercado & Pruebas | Trigger PL/pgSQL con fórmula Haversine (≤ 1.0 km), validación de flujo SPEI vs. Efectivo y auditoría de políticas RLS por usuario. |
| **Fase 4: Despliegue BFF** | Backend PHP & Hostinger | Traducción de endpoints a PHP plano (cURL/PDO), Route Guarding anti-flicker en , PWA ligera y paso a producción a -bash/mes. |

---

## 🛠️ 3. Herramientas y Prácticas de Gestión Utilizadas

### 3.1 Bitácoras Diarias y Standups (Gemini & Cuaderno)
* **Registro Diario:** Documentación diaria de objetivos cumplidos, bloqueos técnicos (CORS, puertos, firmas JWT) y decisiones de arquitectura.
* **Retrospectivas:** Ajuste de rumbo al final de cada fase para redefinir prioridades sin afectar las fechas de entrega.

### 3.2 Git Flow y Estrategia de Ramas
* **Ramas por Característica:** Uso de ramas individuales () integradas gradualmente hacia  y finalmente a .
* **Ambiente Sandbox / Staging:** Uso de una base de datos de laboratorio en Supabase para pruebas de penetración y simulaciones sin alterar la base oficial.

### 3.3 Separación de Responsabilidades (SoC)
* **Contrato de API Documentado:** Definición clara de endpoints y cargas JSON para permitir el desarrollo en paralelo de la Diseñadora Frontend y el equipo Backend.

---

## 📊 4. Cuadro Comparativo: Waterfall vs. Ágil en el Proyecto

| Criterio | Modelo Waterfall (Inicial) | Modelo Ágil (Implementado) |
| :--- | :--- | :--- |
| **Flexibilidad ante Cambios** | Muy Baja (Costo elevado por reproceso) | **Alta** (Adaptación inmediata en cada fase) |
| **Manejo de Riesgos** | Se identifican al final del desarrollo | **Continuo** (Mitigación en tiempo real) |
| **Entrega de Valor** | Única al final del proyecto | **Incremental** (MVPs funcionales por fase) |
| **Alineación con el Cliente** | Puntos de contacto distantes | **Validación frecuente con dueños y cocina** |
| **Costo de Infraestructura** | Asumía servidores dedicados | **Optimización a -bash.00 USD/mes** |

---

## 🏁 5. Conclusión de Gestión
El paso de Waterfall a Metodología Ágil fue la decisión determinante que garantizó el éxito del proyecto. Permitió adaptar la solución técnica a la realidad operativa de la repostería (0% comisiones, cobros directos, reparto a pie ≤ 1 km) y desplegar una arquitectura ligera y resiliente en Hostinger a **costo cero de servidor**.

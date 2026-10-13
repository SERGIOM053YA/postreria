# 📊 Documentación API: Reporte de Corte de Caja (Finanzas)

La vista `reporte_corte_caja` es un endpoint analítico de solo lectura. El motor de PostgreSQL consolida automáticamente las ganancias diarias, agrupando por método de pago (Efectivo / Transferencia SPEI) y excluyendo pedidos cancelados.

**Headers obligatorios de Seguridad:**
* `apikey`: `[NUESTRA_LLAVE_PUBLICA]`
* `Authorization`: `Bearer [TOKEN_DEL_ADMINISTRADOR]` *(Requiere rol de Administrador)*

### Obtener Resumen Financiero Diario (GET)
* **URL:** `https://abwqlettqauklpufupaa.supabase.co/rest/v1/reporte_corte_caja?select=*`
* **Descripción:** Descarga los ingresos totales consolidados por día. Ideal para la vista gerencial del frontend.
* **Respuesta Esperada:** `200 OK` (Arreglo JSON).
* **Estructura de Respuesta:**
```json
[
  {
    "fecha": "2026-09-18",
    "metodo_pago": "Efectivo",
    "total_pedidos": 12,
    "ingresos_totales": 1450.00
  },
  {
    "fecha": "2026-09-18",
    "metodo_pago": "Transferencia SPEI",
    "total_pedidos": 5,
    "ingresos_totales": 820.00
  }
]
# Reports API

## GET /reports/dashboard

Requiere JWT válido (`Authorization: Bearer <token>`) y rol `ADMIN` (ver `docs/security/roles-matrix.md`).

**Response 200:**

```json
{
  "totalVentas": 4599.95,
  "ventasPorTienda": [
    { "tienda": "Tienda Central", "total": 3599.96 },
    { "tienda": "Tienda Norte", "total": 999.99 }
  ],
  "productosMasVendidos": [
    { "productId": "prod_abc123", "nombre": "Laptop Dell XPS", "cantidadVendida": 12 }
  ],
  "productosAgotados": [
    { "productId": "prod_xyz789", "nombre": "Mouse inalámbrico", "storeId": "store_abc123" }
  ],
  "clientesConMasCompras": [
    { "userId": "usr_abc123", "totalGastado": 1999.98, "cantidadPedidos": 3 }
  ],
  "pedidosPorEstado": {
    "PENDIENTE": 2,
    "CONFIRMADO": 5,
    "EN_PREPARACION": 1,
    "ENVIADO": 3,
    "ENTREGADO": 8,
    "CANCELADO": 1
  }
}
```

**Response 403** (rol distinto de ADMIN):

```json
{
  "error": "FORBIDDEN",
  "message": "Only ADMIN can access the executive dashboard",
  "statusCode": 403
}
```

## Cómo se calcula cada campo

| Campo | Fuente | Regla |
|---|---|---|
| `totalVentas` | tabla `orders` | Suma de `total` en pedidos con `estado != CANCELADO` |
| `ventasPorTienda` | `orders` + `products` | Suma por `storeId` (resuelto por `productId` de cada item), pedidos no cancelados |
| `productosMasVendidos` | `orders` | Suma de `quantity` por `productId`, top 10 |
| `productosAgotados` | `products` | Productos activos con `inventario <= 0` |
| `clientesConMasCompras` | `orders` | Top 10 usuarios por total gastado, pedidos no cancelados |
| `pedidosPorEstado` | `orders` | Conteo de pedidos agrupado por `estado` (incluye cancelados) |

## Notas de implementación

- La lambda de Reports tiene acceso de solo lectura (`GetItem`, `Scan`, `Query`) a todas las tablas — sin permisos de escritura en ninguna (`docs/security/iam-policies.md`).
- Usa `Scan` completo con paginación (`LastEvaluatedKey`) sobre `orders`, `products` y `stores`. Para el volumen de datos de este proyecto es aceptable; en un escenario de producción con más escala convendría un GSI por `estado`/`storeId` o agregados precalculados.

# DynamoDB Schema

## Naming convention

All tables follow this pattern:

`cloudshop-g01-{table}`

Billing mode: PAY_PER_REQUEST (on-demand)
Region: us-east-1

## Table: cloudshop-g01-users

Owner: Auth Service

| Attribute | Type | Key |
|---|---|---|
| `userId` | String | Partition Key |
| `email` | String | - |
| `password` | String | - (hashed) |
| `nombre` | String | - |
| `rol` | String | - |
| `activo` | Boolean | - |
| `createdAt` | String | - |
| `updatedAt` | String | - |

Example record:

```json
{
  "userId": "usr_abc123",
  "email": "juan@email.com",
  "password": "$2b$10$hashedpassword",
  "nombre": "Juan Pérez",
  "rol": "CLIENTE",
  "activo": true,
  "createdAt": "2026-06-26T00:00:00Z",
  "updatedAt": "2026-06-26T00:00:00Z"
}
```

## Table: cloudshop-g01-stores

Owner: Catalog Service

| Attribute | Type | Key |
|---|---|---|
| `storeId` | String | Partition Key |
| `nombre` | String | - |
| `descripcion` | String | - |
| `activo` | Boolean | - |
| `createdAt` | String | - |
| `updatedAt` | String | - |

Example record:

```json
{
  "storeId": "store_abc123",
  "nombre": "Tienda Central",
  "descripcion": "Tienda principal de CloudShop",
  "activo": true,
  "createdAt": "2026-06-26T00:00:00Z",
  "updatedAt": "2026-06-26T00:00:00Z"
}
```

## Table: cloudshop-g01-products

Owner: Catalog Service

| Attribute | Type | Key |
|---|---|---|
| `productId` | String | Partition Key |
| `storeId` | String | - |
| `codigo` | String | - |
| `nombre` | String | - |
| `descripcion` | String | - |
| `categoria` | String | - |
| `precio` | Number | - |
| `inventario` | Number | - |
| `activo` | Boolean | - |
| `createdAt` | String | - |
| `updatedAt` | String | - |

Example record:

```json
{
  "productId": "prod_abc123",
  "storeId": "store_abc123",
  "codigo": "LAP-001",
  "nombre": "Laptop Dell XPS",
  "descripcion": "Laptop empresarial 15 pulgadas",
  "categoria": "Electronica",
  "precio": 999.99,
  "inventario": 10,
  "activo": true,
  "createdAt": "2026-06-26T00:00:00Z",
  "updatedAt": "2026-06-26T00:00:00Z"
}
```

## Table: cloudshop-g01-carts

Owner: Orders Service

| Attribute | Type | Key |
|---|---|---|
| `userId` | String | Partition Key |
| `productId` | String | Sort Key |
| `nombre` | String | - |
| `precio` | Number | - |
| `quantity` | Number | - |
| `updatedAt` | String | - |

Example record:

```json
{
  "userId": "usr_abc123",
  "productId": "prod_abc123",
  "nombre": "Laptop Dell XPS",
  "precio": 999.99,
  "quantity": 2,
  "updatedAt": "2026-06-26T00:00:00Z"
}
```

## Table: cloudshop-g01-orders

Owner: Orders Service

| Attribute | Type | Key |
|---|---|---|
| `orderId` | String | Partition Key |
| `userId` | String | Sort Key |
| `items` | List | - |
| `total` | Number | - |
| `estado` | String | - |
| `createdAt` | String | - |
| `updatedAt` | String | - |

Valid values for `estado`:

```text
PENDIENTE
CONFIRMADO
EN_PREPARACION
ENVIADO
ENTREGADO
CANCELADO
```

Example record:

```json
{
  "orderId": "ord_abc123",
  "userId": "usr_abc123",
  "items": [
    {
      "productId": "prod_abc123",
      "nombre": "Laptop Dell XPS",
      "quantity": 1,
      "precio": 999.99
    }
  ],
  "total": 999.99,
  "estado": "PENDIENTE",
  "createdAt": "2026-06-26T00:00:00Z",
  "updatedAt": "2026-06-26T00:00:00Z"
}
```

## Table: cloudshop-g01-audit

Owner: Events Service

| Attribute | Type | Key |
|---|---|---|
| `auditId` | String | Partition Key |
| `timestamp` | String | Sort Key |
| `usuario` | String | - |
| `accion` | String | - |
| `resultado` | String | - |
| `detail` | Map | - |

Valid values for `accion`:

```text
CREAR_USUARIO
DESACTIVAR_USUARIO
ACTUALIZAR_USUARIO
CREAR_PEDIDO
CANCELAR_PEDIDO
ELIMINAR_PRODUCTO
ACTUALIZAR_INVENTARIO
```

Valid values for `resultado`:

```text
EXITOSO
FALLIDO
```

Example record:

```json
{
  "auditId": "aud_abc123",
  "timestamp": "2026-06-26T00:00:00Z",
  "usuario": "usr_abc123",
  "accion": "CREAR_PEDIDO",
  "resultado": "EXITOSO",
  "detail": {
    "orderId": "ord_abc123",
    "total": 999.99
  }
}
```

## Relationships

```text
stores ──────────── products
  storeId      →    storeId

users ───────────── orders
  userId       →    userId

users ───────────── carts
  userId       →    userId

products ────────── carts
  productId    →    productId

orders ──────────── audit
  orderId      →    detail.orderId
```

## Access patterns per service

| Service | Table | Operations |
|---|---|---|
| Auth | users | PutItem, GetItem, UpdateItem, Scan |
| Auth | audit | PutItem |
| Catalog | products | PutItem, GetItem, UpdateItem, DeleteItem, Scan |
| Catalog | stores | PutItem, GetItem, UpdateItem, Scan |
| Catalog | audit | PutItem |
| Orders | orders | PutItem, GetItem, UpdateItem, Scan |
| Orders | carts | PutItem, GetItem, UpdateItem, DeleteItem, Scan |
| Events | products | GetItem, UpdateItem |
| Events | audit | PutItem |
| Reports | all tables | GetItem, Scan, Query (read only) |

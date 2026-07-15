# Catalog API

Servicio: `lambdas/catalog/`

Tablas: `cloudshop-g01-products`, `cloudshop-g01-stores` (ver `docs/database/dynamodb-schema.md`)

Permisos por endpoint: ver `docs/security/roles-matrix.md`

Todos los endpoints de este documento requieren JWT válido (`Authorization: Bearer <token>`).
El formato de error es el unificado del proyecto (`docs/contracts/auth-contract.md`):

```json
{
  "error": "ERROR_CODE",
  "message": "Descripción legible",
  "statusCode": 400
}
```

---
## Stores

### POST /stores

Rol requerido: `ADMIN`.

**Request:**

```json
{
  "nombre": "Tienda Central",
  "descripcion": "Tienda principal de CloudShop"
}
```

**Response 201:**

```json
{
  "storeId": "store_abc123",
  "nombre": "Tienda Central",
  "descripcion": "Tienda principal de CloudShop",
  "activo": true,
  "createdAt": "2026-07-15T00:00:00Z",
  "updatedAt": "2026-07-15T00:00:00Z"
}
```

**Response 400** (`VALIDATION_ERROR`): falta `nombre`.

### GET /stores

Roles: `ADMIN`, `OPERADOR`, `CLIENTE`. Devuelve solo tiendas con `activo: true`.

**Response 200:**

```json
{
  "stores": [
    {
      "storeId": "store_abc123",
      "nombre": "Tienda Central",
      "descripcion": "Tienda principal de CloudShop",
      "activo": true,
      "createdAt": "2026-07-15T00:00:00Z",
      "updatedAt": "2026-07-15T00:00:00Z"
    }
  ]
}
```

### GET /stores/{storeId}

Roles: `ADMIN`, `OPERADOR`, `CLIENTE`. Devuelve la tienda exista o no `activo` (para que ADMIN pueda ver tiendas desactivadas).

**Response 200:** mismo objeto que arriba.
**Response 404** (`NOT_FOUND`): storeId no existe.

### PUT /stores/{storeId}

Rol requerido: `ADMIN`. Campos editables: `nombre` y `descripcion` (parcial, solo lo que venga en el body).

**Request:**

```json
{ "nombre": "Tienda Central Renovada" }
```

**Response 200:**

```json
{
  "storeId": "store_abc123",
  "nombre": "Tienda Central Renovada",
  "descripcion": "Tienda principal de CloudShop",
  "updatedAt": "2026-07-15T01:00:00Z"
}
```

**Response 404** (`NOT_FOUND`).

### DELETE /stores/{storeId}

Rol requerido: `ADMIN`. **Soft delete** (`activo: false`), no hay evento asociado (no está en `events-contract.md`), no borra los productos de esa tienda.

**Response 200:**

```json
{
    "storeId": "store_abc123",
    "activo": false,
    "updatedAt": "2026-07-15T01:00:00Z"
}
```

---
## Products

### POST /products

Rol requerido: `ADMIN`. Valida que `storeId` exista **y** tenga `activo: true` en la tabla `stores`; si no, `400 VALIDATION_ERROR`.

**Request:**

```json
{
  "codigo": "LAP-001",
  "nombre": "Laptop Dell XPS",
  "descripcion": "Laptop empresarial 15 pulgadas",
  "categoria": "Electronica",
  "precio": 999.99,
  "inventario": 10,
  "storeId": "store_abc123"
}
```

**Response 201:**

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
  "createdAt": "2026-07-15T00:00:00Z",
  "updatedAt": "2026-07-15T00:00:00Z"
}
```

**Response 400** (`VALIDATION_ERROR`): falta un campo requerido, o `storeId` no corresponde a una tienda activa.

### GET /products

Roles: `ADMIN`, `OPERADOR`, `CLIENTE`. Filtros opcionales por query string: `?categoria=Electronica`, `?storeId=store_abc123`.

**Response 200:**

```json
{
  "products": [
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
      "createdAt": "2026-07-15T00:00:00Z",
      "updatedAt": "2026-07-15T00:00:00Z"
    }
  ]
}
```

### GET /products/{productId}

Roles: `ADMIN`, `OPERADOR`, `CLIENTE`.

**Response 200:** mismo objeto que un elemento de la lista anterior.
**Response 404** (`NOT_FOUND`).

### PUT /products/{productId}

- `ADMIN`: puede actualizar cualquier campo (`codigo`, `nombre`, `descripcion`, `categoria`, `precio`, `inventario`, `storeId` y `activo`). Si cambia `storeId`, se vuelve a validar que la tienda exista y esté activa.
- `OPERADOR`: el body **solo** puede traer `inventario`. Si trae cualquier otro campo, `403 FORBIDDEN`:

```json
{
  "error": "FORBIDDEN",
  "message": "OPERADOR solo puede actualizar el campo 'inventario'. Elimina los demás campos del body e intenta de nuevo.",
  "statusCode": 403
}
```

- `CLIENTE`: `403 FORBIDDEN` (no tiene acceso a este endpoint).

**Request (OPERADOR):**

```json
{ "inventario": 8 }
```

**Response 200:**

```json
{
  "productId": "prod_abc123",
  "inventario": 8,
  "updatedAt": "2026-07-15T02:00:00Z"
}
```

**Response 404** (`NOT_FOUND`).

### DELETE /products/{productId}

Rol requerido: `ADMIN`. **Hard delete.** Emite el evento `PRODUCT_DELETED` a EventBridge (`docs/contracts/events-contract.md`); Events Service ya consume este evento y escribe la auditoría `ELIMINAR_PRODUCTO` — Catalog **no** escribe directo a la tabla `audit`.

**Response 200:**

```json
{
    "productId": "prod_abc123",
    "deleted": true
}
```

**Response 404** (`NOT_FOUND`).

---
## Datos mock

```json
{
  "stores": [
    {
      "storeId": "store_mock001",
      "nombre": "Tienda Central",
      "descripcion": "Tienda principal de CloudShop",
      "activo": true,
      "createdAt": "2026-07-15T00:00:00Z",
      "updatedAt": "2026-07-15T00:00:00Z"
    },
    {
      "storeId": "store_mock002",
      "nombre": "Tienda Norte",
      "descripcion": "Sucursal zona norte",
      "activo": true,
      "createdAt": "2026-07-15T00:00:00Z",
      "updatedAt": "2026-07-15T00:00:00Z"
    }
  ],
  "products": [
    {
      "productId": "prod_mock001",
      "storeId": "store_mock001",
      "codigo": "LAP-001",
      "nombre": "Laptop Dell XPS",
      "descripcion": "Laptop empresarial 15 pulgadas",
      "categoria": "Electronica",
      "precio": 999.99,
      "inventario": 10,
      "activo": true,
      "createdAt": "2026-07-15T00:00:00Z",
      "updatedAt": "2026-07-15T00:00:00Z"
    },
    {
      "productId": "prod_mock002",
      "storeId": "store_mock001",
      "codigo": "MOU-002",
      "nombre": "Mouse inalámbrico",
      "descripcion": "Mouse ergonómico 2.4GHz",
      "categoria": "Accesorios",
      "precio": 19.99,
      "inventario": 0,
      "activo": true,
      "createdAt": "2026-07-15T00:00:00Z",
      "updatedAt": "2026-07-15T00:00:00Z"
    },
    {
      "productId": "prod_mock003",
      "storeId": "store_mock002",
      "codigo": "TEC-003",
      "nombre": "Teclado mecánico",
      "descripcion": "Teclado mecánico retroiluminado",
      "categoria": "Accesorios",
      "precio": 59.99,
      "inventario": 15,
      "activo": true,
      "createdAt": "2026-07-15T00:00:00Z",
      "updatedAt": "2026-07-15T00:00:00Z"
    }
  ]
}
```

## Notas de implementación

- `GET /products` y `GET /stores` usan `Scan` completo — igual que Reports.
- Desactivar una tienda (`DELETE /stores/{id}`) no afecta los productos que le pertenecen — quedan con su `storeId` apuntando a una tienda inactiva. Es una decisión consciente, ya que el alcance del proyecto no solicita cascada.

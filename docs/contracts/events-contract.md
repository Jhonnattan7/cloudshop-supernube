# Events Contract

## Event structure (all events)

```json
{
  "source": "cloudshop.{service}",
  "detail-type": "EVENT_NAME",
  "detail": {}
}
```

## ORDER_CREATED

Published by: Orders Service (`lambdas/orders/`)
Consumed by: Events Service (`lambdas/events/`)

```json
{
  "source": "cloudshop.orders",
  "detail-type": "ORDER_CREATED",
  "detail": {
    "orderId": "ord_abc123",
    "userId": "usr_abc123",
    "email": "user@email.com",
    "items": [
      {
        "productId": "prod_abc123",
        "nombre": "Laptop Dell XPS",
        "quantity": 1,
        "price": 999.99
      }
    ],
    "total": 999.99,
    "timestamp": "2026-06-26T00:00:00Z"
  }
}
```

**`email` field — where it comes from:**

Events Service only has IAM permissions over the `products` and `audit` tables (see `docs/security/iam-policies.md`), not over `users`. It cannot look up the customer's email itself, so Orders Service must include it directly in the event.

Orders Service must read `email` from `event.requestContext.authorizer.email` (already present in the validated JWT context — see `docs/contracts/auth-contract.md`), **not** from a `GetItem`/`Scan` against the `users` table. Querying `users` from Orders would require a new IAM permission that its documented role does not have and does not need — a violation of least privilege (PDF section 5).

**Triggers:**

- Decrement inventory per item in `products` table
- Write audit record with `accion: CREAR_PEDIDO`
- Send confirmation email via SES to the user

## ORDER_CANCELLED

Published by: Orders Service (`lambdas/orders/`)
Consumed by: Events Service (`lambdas/events/`)

```json
{
  "source": "cloudshop.orders",
  "detail-type": "ORDER_CANCELLED",
  "detail": {
    "orderId": "ord_abc123",
    "userId": "usr_abc123",
    "reason": "Customer request",
    "timestamp": "2026-06-26T00:00:00Z"
  }
}
```

**Triggers:**

- Write audit record with `accion: CANCELAR_PEDIDO`

## PRODUCT_DELETED

Published by: Catalog Service (`lambdas/catalog/`)
Consumed by: Events Service (`lambdas/events/`)

```json
{
  "source": "cloudshop.catalog",
  "detail-type": "PRODUCT_DELETED",
  "detail": {
    "productId": "prod_abc123",
    "nombre": "Laptop Dell XPS",
    "deletedBy": "usr_admin01",
    "timestamp": "2026-06-26T00:00:00Z"
  }
}
```

**Triggers:**

- Write audit record with `accion: ELIMINAR_PRODUCTO`

## USER_CREATED

Published by: Auth Service (`lambdas/auth/`)
Consumed by: Events Service (`lambdas/events/`)

```json
{
  "source": "cloudshop.auth",
  "detail-type": "USER_CREATED",
  "detail": {
    "userId": "usr_abc123",
    "email": "user@email.com",
    "rol": "CLIENTE",
    "timestamp": "2026-06-26T00:00:00Z"
  }
}
```

**Triggers:**

- Write audit record with `accion: CREAR_USUARIO`

## INVENTORY_UPDATED

Published by: Events Service after consuming ORDER_CREATED
Consumed by: CloudWatch metrics

```json
{
  "source": "cloudshop.events",
  "detail-type": "INVENTORY_UPDATED",
  "detail": {
    "productId": "prod_abc123",
    "previousStock": 10,
    "newStock": 9,
    "orderId": "ord_abc123",
    "timestamp": "2026-06-26T00:00:00Z"
  }
}
```

## Who publishes and who consumes

| Event | Publisher | Consumer | Action |
|---|---|---|---|
| `ORDER_CREATED` | Orders | Events | Inventory + Audit + Email |
| `ORDER_CANCELLED` | Orders | Events | Audit |
| `PRODUCT_DELETED` | Catalog | Events | Audit |
| `USER_CREATED` | Auth | Events | Audit |
| `INVENTORY_UPDATED` | Events | CloudWatch | Metrics |

## Audit record format

Every event that triggers an audit write uses this exact structure:

```json
{
  "auditId": "aud_abc123",
  "usuario": "usr_abc123",
  "accion": "CREAR_PEDIDO",
  "fecha": "2026-06-26T00:00:00Z",
  "resultado": "EXITOSO"
}
```

### All valid accion values

| Value | Trigger |
|---|---|
| `CREAR_USUARIO` | USER_CREATED event |
| `DESACTIVAR_USUARIO` | DELETE /users/{userId} |
| `ACTUALIZAR_USUARIO` | PUT /users/{userId} |
| `CREAR_PEDIDO` | ORDER_CREATED event |
| `CANCELAR_PEDIDO` | ORDER_CANCELLED event |
| `ELIMINAR_PRODUCTO` | PRODUCT_DELETED event |
| `ACTUALIZAR_INVENTARIO` | INVENTORY_UPDATED event |

## EventBridge bus

Bus name: `cloudshop-g01-event-bus`
Region: `us-east-1`

All services publish to this bus.
No service creates its own bus.
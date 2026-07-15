# CloudShop Enterprise — Architecture Overview

## 1. General flow

```text
User
↓
Amazon CloudFront      (CDN + cache)
↓
S3                     (static frontend)
↓
AWS WAF                (security layer)
↓
Amazon API Gateway     (single entry point)
↓
┌──────────┬──────────┬──────────┬──────────┐
│   Auth   │ Catalog  │  Orders  │ Reports  │
│  Lambda  │  Lambda  │  Lambda  │  Lambda  │
└──────────┴──────────┴──────────┴──────────┘
↓
Amazon DynamoDB        (operational data store)
↓
Amazon EventBridge     (event bus — decoupling layer)
↓
┌─────────────────┬─────────────────┬─────────────────┐
│ Update inventory│  Save audit log │   Send email    │
│    (Lambda)     │    (Lambda)     │    (Lambda)     │
└─────────────────┴─────────────────┴─────────────────┘
↓                        ↓                  ↓
DynamoDB              DynamoDB             Amazon SES
(products table)      (audit table)
↓
Amazon CloudWatch      (logs + metrics + dashboard)
```

## 2. Why this architecture

The system uses an **event-driven + serverless** approach because:

- **Scalability** — Lambda scales automatically per request, no servers to manage.
- **Decoupling** — Orders does not call Inventory or SES directly. It publishes an event and each consumer handles its own responsibility independently.
- **Observability** — CloudWatch captures every Lambda log and API Gateway metric in one place.
- **Security** — WAF filters malicious traffic before it reaches the API. IAM roles follow least privilege per Lambda.

## 3. Services and responsibilities

### Auth Service (`lambdas/auth/`)
**Owns:** `/auth/*` and `/users/*` routes

Full auth contract -> [docs/contracts/auth-contract.md](../contracts/auth-contract.md)

**Does:**
- User registration and login
- JWT generation with role embedded (`ADMIN`, `OPERADOR`, `CLIENTE`)
- User consultation, update, and deactivation
- Lambda Authorizer — validates JWT for all other services

**Does NOT:**
- Manage products, stores, orders, or any business entity
- Send emails directly

### Catalog Service (`lambdas/catalog/`)
**Owns:** `/products/*` and `/stores/*` routes

**Does:**
- Full CRUD for products (code, name, description, category, price, inventory, store)
- Full CRUD for stores
- Inventory read — returns current stock per product

**Does NOT:**
- Create or modify orders
- Update inventory after a purchase (that is triggered by EventBridge -> events Lambda)

### Orders Service (`lambdas/orders/`)
**Owns:** `/cart/*` and `/orders/*` routes

**Does:**
- Shopping cart management (add, modify, remove, clear)
- Order creation from cart
- Order status transitions: `PENDIENTE -> CONFIRMADO -> EN_PREPARACION -> ENVIADO -> ENTREGADO / CANCELADO`
- **Publishes** `ORDER_CREATED` and `ORDER_CANCELLED` events to EventBridge

**Does NOT:**
- Send confirmation emails directly
- Update inventory directly
- Write to the audit log directly

> These three responsibilities belong to the events Lambdas that consume the EventBridge events.

### Reports Service (`lambdas/reports/`)
**Owns:** `/reports/*` and `/dashboard/*` routes

**Does:**
- Executive dashboard: total sales, sales by store, top products, out-of-stock products, top customers, orders by status
- Read-only queries across DynamoDB tables

**Does NOT:**
- Create, update, or delete any data
- Publish events

### Events Service (`lambdas/events/`)
**Owns:** EventBridge consumers — no API Gateway routes

Full event contract -> [docs/contracts/events-contract.md](../contracts/events-contract.md)

**Does:**
- `ORDER_CREATED` -> decrement inventory in products table, publish `INVENTORY_UPDATED`, write audit record (`CREAR_PEDIDO` + `ACTUALIZAR_INVENTARIO`), send confirmation email via SES
- `ORDER_CANCELLED` -> write audit record (`CANCELAR_PEDIDO`)
- `PRODUCT_DELETED` -> write audit record (`ELIMINAR_PRODUCTO`)
- `USER_CREATED` -> write audit record (`CREAR_USUARIO`)

**Does NOT:**
- Expose HTTP endpoints
- Initiate business logic — only reacts to events

### Shared (`lambdas/shared/`)

Common utilities used by all services:
- Lambda Authorizer (JWT validation + role extraction)
- Error response formatter
- DynamoDB client wrapper
- EventBridge publisher helper

## 4. DynamoDB tables

| Table | Partition Key | Sort Key | Owner |
|---|---|---|---|
| `users` | `userId` | — | Auth |
| `products` | `productId` | — | Catalog |
| `stores` | `storeId` | — | Catalog |
| `orders` | `userId` | `orderId` | Orders |
| `carts` | `userId` | `productId` | Orders |
| `audit` | `auditId` | `timestamp` | Events |

Each service only reads/writes its own tables.
Reports is the only service with read access across all tables.

## 5. Event contracts

All EventBridge events use source `cloudshop.orders` and follow this structure:

```json
{
  "source": "cloudshop.orders",
  "detail-type": "ORDER_CREATED",
  "detail": {
    "orderId": "ord_123",
    "userId": "usr_123",
    "items": [
      { "productId": "prod_456", "quantity": 2, "price": 29.99 }
    ],
    "total": 59.98,
    "timestamp": "2026-06-26T00:00:00Z"
  }
}
```

Full event contracts -> [docs/contracts/events-contract.md](../contracts/events-contract.md)

## 6. Security model

Security overview -> [docs/security/security-overview.md](../security/security-overview.md)

| Role | Can do |
|---|---|
| `ADMIN` | Manage users, stores, products, view reports |
| `OPERADOR` | Manage inventory, manage orders |
| `CLIENTE` | Browse products, manage own cart, view own orders |

Every endpoint validates:

1. JWT present and valid (Lambda Authorizer)
2. Role has permission for that route and method

Full permission matrix -> [docs/security/roles-matrix.md](../security/roles-matrix.md)

## 7. Infrastructure as code

All AWS resources are provisioned exclusively via Terraform.
No manual resource creation is permitted.

Terraform outputs (ARNs, URLs, table names) are published in the
root `README.md` after each `terraform apply`.

Modules -> [terraform/modules/](../../terraform/modules/)
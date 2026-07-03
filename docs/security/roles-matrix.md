# Roles and Permissions Matrix

## Business roles

| Role | Who uses it |
|---|---|
| `ADMIN` | Platform administrator - full access |
| `OPERADOR` | Store operator - inventory and orders |
| `CLIENTE` | End customer - own cart and orders |

Legend: ✓ allowed - — not allowed - ✓* restricted (own resources only)

## Auth endpoints

| Endpoint | Method | ADMIN | OPERADOR | CLIENTE | Notes |
|---|---|---|---|---|---|
| `/auth/register` | POST | ✓ | ✓ | ✓ | Public - no token required |
| `/auth/login` | POST | ✓ | ✓ | ✓ | Public - no token required |
| `/users` | GET | ✓ | — | — | Lists all users |
| `/users/{id}` | GET | ✓ | — | — | Single user detail |
| `/users/{id}` | PUT | ✓ | — | — | Update name or role |
| `/users/{id}` | DELETE | ✓ | — | — | Soft delete - sets activo: false |

## Catalog endpoints

| Endpoint | Method | ADMIN | OPERADOR | CLIENTE | Notes |
|---|---|---|---|---|---|
| `/stores` | POST | ✓ | — | — | Create store |
| `/stores` | GET | ✓ | ✓ | ✓ | List active stores |
| `/stores/{id}` | GET | ✓ | ✓ | ✓ | Store detail |
| `/stores/{id}` | PUT | ✓ | — | — | Update store |
| `/stores/{id}` | DELETE | ✓ | — | — | Soft delete store |
| `/products` | POST | ✓ | — | — | Create product |
| `/products` | GET | ✓ | ✓ | ✓ | List products - filter by category |
| `/products/{id}` | GET | ✓ | ✓ | ✓ | Product detail |
| `/products/{id}` | PUT | ✓ | ✓ | — | ADMIN updates anything - OPERADOR updates inventory only |
| `/products/{id}` | DELETE | ✓ | — | — | Hard delete - triggers PRODUCT_DELETED event |

## Orders endpoints

| Endpoint | Method | ADMIN | OPERADOR | CLIENTE | Notes |
|---|---|---|---|---|---|
| `/cart` | GET | ✓ | — | ✓* | Own cart only |
| `/cart/items` | POST | ✓ | — | ✓ | Add item to cart |
| `/cart/items/{productId}` | PUT | ✓ | — | ✓* | Modify quantity - own cart only |
| `/cart/items/{productId}` | DELETE | ✓ | — | ✓* | Remove item - own cart only |
| `/cart` | DELETE | ✓ | — | ✓* | Clear cart - own cart only |
| `/orders` | POST | ✓ | ✓ | ✓ | Create order from cart - triggers ORDER_CREATED |
| `/orders` | GET | ✓ | ✓ | — | List all orders |
| `/orders/{id}` | GET | ✓ | ✓ | ✓* | CLIENTE sees own orders only |
| `/orders/{id}/status` | PUT | ✓ | ✓ | — | Update order status |
| `/orders/{id}/cancel` | PUT | ✓ | — | ✓* | CLIENTE cancels own orders only - triggers ORDER_CANCELLED |

## Reports endpoints

| Endpoint | Method | ADMIN | OPERADOR | CLIENTE | Notes |
|---|---|---|---|---|---|
| `/reports/dashboard` | GET | ✓ | — | — | Full executive dashboard |

## Status transition rules

Only ADMIN and OPERADOR can move an order through states.
CLIENTE can only cancel.

```text
PENDIENTE -> CONFIRMADO        (ADMIN, OPERADOR)
CONFIRMADO -> EN_PREPARACION   (ADMIN, OPERADOR)
EN_PREPARACION -> ENVIADO      (ADMIN, OPERADOR)
ENVIADO -> ENTREGADO           (ADMIN, OPERADOR)

Any state -> CANCELADO         (ADMIN or CLIENTE - own order only)
```

## Enforcement

Role is checked at two levels:

1. **Lambda Authorizer** - validates JWT and extracts rol
2. **Service Lambda** - checks rol against the matrix above before executing

Both checks are mandatory. A valid token alone is not enough.

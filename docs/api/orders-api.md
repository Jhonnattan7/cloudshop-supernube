# Contrato de API — Servicio de Pedidos y Carrito (Orders & Cart)

El servicio de pedidos expone endpoints protegidos con autenticación JWT para gestionar el carrito de compras del usuario y la creación/actualización de pedidos.

---

## Endpoints de Carrito (`/cart`)

### 1. Obtener Carrito del Usuario
* **Método**: `GET /cart`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "items": [
      {
        "productId": "prod_123",
        "quantity": 2,
        "updatedAt": "2026-07-21T19:00:00.000Z"
      }
    ]
  }
  ```

### 2. Agregar Producto al Carrito
* **Método**: `POST /cart/items`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Body**:
  ```json
  {
    "productId": "prod_123",
    "quantity": 2
  }
  ```
* **Respuesta Exitosa (201 Created)**:
  ```json
  {
    "message": "Producto agregado al carrito",
    "item": { "productId": "prod_123", "quantity": 2 }
  }
  ```

### 3. Modificar Cantidad en el Carrito
* **Método**: `PUT /cart/items/{productId}`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Body**:
  ```json
  {
    "quantity": 5
  }
  ```

### 4. Vaciar Carrito
* **Método**: `DELETE /cart`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Respuesta Exitosa (200 OK)**:
  ```json
  { "message": "Carrito vaciado exitosamente" }
  ```

---

## Endpoints de Pedidos (`/orders`)

### 5. Crear Pedido (Checkout - Caso 2 del TDR)
Convierte los ítems del carrito en un pedido en estado `PENDIENTE` y dispara el evento `ORDER_CREATED` a EventBridge.

* **Método**: `POST /orders`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Respuesta Exitosa (201 Created)**:
  ```json
  {
    "orderId": "ord_987654321",
    "userId": "usr_111",
    "email": "cliente@dominio.com",
    "items": [
      {
        "productId": "prod_123",
        "nombre": "Laptop Cloud",
        "precioUnitario": 1200.00,
        "quantity": 1,
        "subtotal": 1200.00
      }
    ],
    "total": 1200.00,
    "estado": "PENDIENTE",
    "createdAt": "2026-07-21T19:30:00.000Z"
  }
  ```

### 6. Listar Pedidos
* **Método**: `GET /orders`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Query Parameters (Opcionales)**: `estado=PENDIENTE`, `userId=usr_111` (solo Admin/Operador)
* **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "orders": [ ... ]
  }
  ```

### 7. Consultar Detalle de Pedido
* **Método**: `GET /orders/{orderId}`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`

### 8. Actualizar Estado de Pedido (Operador / Admin)
* **Método**: `PUT /orders/{orderId}/status`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Body**:
  ```json
  {
    "estado": "CONFIRMADO"
  }
  ```
  *(Estados válidos: PENDIENTE -> CONFIRMADO -> EN_PREPARACION -> ENVIADO -> ENTREGADO)*

### 9. Cancelar Pedido (Cliente / Operador / Admin)
* **Método**: `POST /orders/{orderId}/cancel`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Body**:
  ```json
  {
    "reason": "Cliente solicito cancelacion"
  }
  ```
  *Dispara evento `ORDER_CANCELLED` a EventBridge.*

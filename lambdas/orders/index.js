const {
  getCartHandler,
  addItemHandler,
  updateItemHandler,
  removeItemHandler,
  clearCartHandler
} = require('./cart');
const {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateStatusHandler,
  cancelOrderHandler
} = require('./orders');
const { errorResponse } = require('./response');

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,Idempotency-Key',
          'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
        },
        body: ''
      };
    }

    const rol = event.requestContext?.authorizer?.rol;

    // --- Carrito: reservado exclusivamente para CLIENTE
    if (event.resource === '/cart' && event.httpMethod === 'GET') {
      if (rol !== 'CLIENTE') return errorResponse(403, 'FORBIDDEN', 'Solo usuarios con rol CLIENTE tienen carrito de compras');
      return await getCartHandler(event);
    }
    if (event.resource === '/cart' && event.httpMethod === 'DELETE') {
      if (rol !== 'CLIENTE') return errorResponse(403, 'FORBIDDEN', 'Solo usuarios con rol CLIENTE pueden vaciar el carrito');
      return await clearCartHandler(event);
    }
    if (event.resource === '/cart/items' && event.httpMethod === 'POST') {
      if (rol !== 'CLIENTE') return errorResponse(403, 'FORBIDDEN', 'Solo usuarios con rol CLIENTE pueden agregar productos al carrito');
      return await addItemHandler(event);
    }
    if (event.resource === '/cart/items/{productId}' && event.httpMethod === 'PUT') {
      if (rol !== 'CLIENTE') return errorResponse(403, 'FORBIDDEN', 'Solo usuarios con rol CLIENTE pueden modificar el carrito');
      return await updateItemHandler(event);
    }
    if (event.resource === '/cart/items/{productId}' && event.httpMethod === 'DELETE') {
      if (rol !== 'CLIENTE') return errorResponse(403, 'FORBIDDEN', 'Solo usuarios con rol CLIENTE pueden eliminar items del carrito');
      return await removeItemHandler(event);
    }

    // --- Pedidos ---
    if (event.resource === '/orders' && event.httpMethod === 'POST') {
      if (rol !== 'CLIENTE') return errorResponse(403, 'FORBIDDEN', 'Solo usuarios con rol CLIENTE pueden crear pedidos');
      return await createOrderHandler(event);
    }
    if (event.resource === '/orders' && event.httpMethod === 'GET') {
      // CLIENTE ve solo lo suyo, ADMIN/OPERADOR ven todo (filtrado dentro del handler)
      return await listOrdersHandler(event, rol);
    }
    if (event.resource === '/orders/{orderId}' && event.httpMethod === 'GET') {
      return await getOrderHandler(event, rol);
    }
    if (event.resource === '/orders/{orderId}/status' && event.httpMethod === 'PUT') {
      if (rol !== 'ADMIN' && rol !== 'OPERADOR') {
        return errorResponse(403, 'FORBIDDEN', 'Solo ADMIN u OPERADOR pueden actualizar el estado del pedido');
      }
      return await updateStatusHandler(event);
    }
    if (event.resource === '/orders/{orderId}/cancel' && event.httpMethod === 'POST') {
      return await cancelOrderHandler(event, rol);
    }

    return errorResponse(404, 'NOT_FOUND', 'Route not found');
  } catch (err) {
    console.error(err);
    return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
};
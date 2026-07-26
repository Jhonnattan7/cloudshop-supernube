const crypto = require('crypto');
const { PutCommand, QueryCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');
const { successResponse, errorResponse } = require('./response');
const { getProductById } = require('./catalogclient');
const { publishOrderCreated, publishOrderCancelled } = require('./eventbridge');
const { getCartItems, clearCartItems } = require('./cart');

const ORDERS_TABLE = process.env.ORDERS_TABLE;

// Estados: Pendiente -> Confirmado -> En preparación -> Enviado -> Entregado (o Cancelado)
const TRANSITIONS = {
  PENDIENTE: ['CONFIRMADO'],
  CONFIRMADO: ['EN_PREPARACION'],
  EN_PREPARACION: ['ENVIADO'],
  ENVIADO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: []
};

const CANCELABLE_STATES = ['PENDIENTE', 'CONFIRMADO', 'EN_PREPARACION'];

function getHeader(event, headerName) {
  const headers = event.headers || {};
  const expectedName = headerName.toLowerCase();

  const matchingHeader = Object.keys(headers).find(
    (key) => key.toLowerCase() === expectedName
  );

  return matchingHeader ? headers[matchingHeader] : undefined;
}

function buildIdempotentOrderId(userId, idempotencyKey) {
  const hash = crypto
    .createHash('sha256')
    .update(`${userId}:${idempotencyKey}`)
    .digest('hex')
    .slice(0, 32);

  return `ord_${hash}`;
}

async function getOrderById(orderId) {
  const result = await docClient.send(new QueryCommand({
    TableName: ORDERS_TABLE,
    KeyConditionExpression: 'orderId = :orderId',
    ExpressionAttributeValues: { ':orderId': orderId }
  }));
  const item = (result.Items && result.Items[0]) || null;
  if (item) {
    const st = item.estado || item.status || 'PENDIENTE';
    item.estado = st;
    item.status = st;
  }
  return item;
}

async function createOrderHandler(event) {
  const userId = event.requestContext.authorizer.userId;
  const email = event.requestContext.authorizer.email;

  const idempotencyKey = getHeader(event, 'Idempotency-Key');

  if (
    !idempotencyKey ||
    typeof idempotencyKey !== 'string' ||
    idempotencyKey.trim().length < 8 ||
    idempotencyKey.trim().length > 128
  ) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'El header Idempotency-Key es obligatorio y debe tener entre 8 y 128 caracteres'
    );
  }

  const normalizedIdempotencyKey = idempotencyKey.trim();
  const orderId = buildIdempotentOrderId(
    userId,
    normalizedIdempotencyKey
  );

  /*
   * Se comprueba primero si esta operación ya creó un pedido.
   * Esto evita volver a consultar el carrito o publicar otro evento
   * cuando el cliente repite exactamente el mismo checkout.
   */
  const existingOrder = await getOrderById(orderId);

  if (existingOrder) {
    if (existingOrder.userId !== userId) {
      return errorResponse(
        409,
        'IDEMPOTENCY_CONFLICT',
        'La clave de idempotencia ya fue utilizada'
      );
    }

    return successResponse(200, {
      ...existingOrder,
      idempotentReplay: true
    });
  }

  const cartItems = await getCartItems(userId);

  if (cartItems.length === 0) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'El carrito esta vacio'
    );
  }

  const orderItems = [];
  let total = 0;

  for (const cartItem of cartItems) {
    const product = await getProductById(cartItem.productId);

    if (!product || product.activo === false) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        `El producto ${cartItem.productId} ya no esta disponible`
      );
    }

    if (product.inventario < cartItem.quantity) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        `Inventario insuficiente para ${product.nombre}`
      );
    }

    const subtotal = product.precio * cartItem.quantity;
    total += subtotal;

    orderItems.push({
      productId: product.productId,
      nombre: product.nombre,
      precioUnitario: product.precio,
      quantity: cartItem.quantity,
      subtotal
    });
  }

  const now = new Date().toISOString();

  const order = {
    orderId,
    userId,
    email,
    idempotencyKey: normalizedIdempotencyKey,
    items: orderItems,
    total,
    estado: 'PENDIENTE',
    eventPublished: false,
    createdAt: now,
    updatedAt: now
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: ORDERS_TABLE,
        Item: order,

        /*
         * Aunque lleguen dos peticiones simultáneamente, solamente
         * una podrá crear el pedido.
         */
        ConditionExpression:
          'attribute_not_exists(orderId) AND attribute_not_exists(userId)'
      })
    );
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      const duplicatedOrder = await getOrderById(orderId);

      if (duplicatedOrder && duplicatedOrder.userId === userId) {
        return successResponse(200, {
          ...duplicatedOrder,
          idempotentReplay: true
        });
      }

      return errorResponse(
        409,
        'IDEMPOTENCY_CONFLICT',
        'No se pudo procesar nuevamente este checkout'
      );
    }

    throw err;
  }

  await publishOrderCreated({
    orderId,
    userId,
    email,
    items: orderItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    })),
    total
  });

  await docClient.send(
    new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: {
        orderId,
        userId
      },
      UpdateExpression:
        'SET eventPublished = :published, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':published': true,
        ':updatedAt': new Date().toISOString()
      }
    })
  );

  await clearCartItems(userId);

  return successResponse(201, order);
}

async function listOrdersHandler(event, rol) {
  const userId = event.requestContext.authorizer.userId;
  const qs = event.queryStringParameters || {};

  const filters = [];
  const exprValues = {};
  const exprNames = {};

  if (rol === 'CLIENTE') {
    filters.push('userId = :uid');
    exprValues[':uid'] = userId;
  }

  if (qs.status || qs.estado) {
    filters.push('(#st = :st OR estado = :st)');
    exprValues[':st'] = qs.status || qs.estado;
    exprNames['#st'] = 'status';
  }

  const params = { TableName: ORDERS_TABLE };
  if (filters.length > 0) {
    params.FilterExpression = filters.join(' AND ');
    params.ExpressionAttributeValues = exprValues;
    if (Object.keys(exprNames).length > 0) {
      params.ExpressionAttributeNames = exprNames;
    }
  }

  const result = await docClient.send(new ScanCommand(params));
  const items = (result.Items || []).map((o) => {
    const st = o.estado || o.status || 'PENDIENTE';
    return { ...o, estado: st, status: st };
  });

  return successResponse(200, { orders: items });
}

async function getOrderHandler(event, rol) {
  const { orderId } = event.pathParameters || {};
  const userId = event.requestContext.authorizer.userId;

  const order = await getOrderById(orderId);
  if (!order) {
    return errorResponse(404, 'NOT_FOUND', 'Order not found');
  }

  if (rol === 'CLIENTE' && order.userId !== userId) {
    return errorResponse(403, 'FORBIDDEN', 'No puedes consultar pedidos de otro usuario');
  }

  return successResponse(200, order);
}

async function updateStatusHandler(event) {
  const { orderId } = event.pathParameters || {};
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const { estado } = body;
  if (!estado) {
    return errorResponse(400, 'VALIDATION_ERROR', 'estado is required');
  }
  if (estado === 'CANCELADO') {
    return errorResponse(400, 'VALIDATION_ERROR', 'Para cancelar un pedido usa POST /orders/{orderId}/cancel');
  }

  const existing = await getOrderById(orderId);
  if (!existing) {
    return errorResponse(404, 'NOT_FOUND', 'Order not found');
  }

  const current = existing.estado || existing.status || 'PENDIENTE';
  const allowed = TRANSITIONS[current] || [];
  if (!allowed.includes(estado)) {
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      `No se puede pasar de ${current} a ${estado}. Transiciones validas desde ${current}: ${allowed.join(', ') || 'ninguna'}`
    );
  }

  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: ORDERS_TABLE,
    Key: { orderId, userId: existing.userId },
    UpdateExpression: 'SET estado = :estado, #st = :estado, updatedAt = :now',
    ExpressionAttributeNames: { '#st': 'status' },
    ExpressionAttributeValues: { ':estado': estado, ':now': now }
  }));

  return successResponse(200, { orderId, estado, status: estado, updatedAt: now });
}

// CLIENTE puede cancelar su propio pedido mientras siga en un estado cancelable.
// ADMIN/OPERADOR pueden cancelar cualquier pedido bajo la misma regla de estado.
async function cancelOrderHandler(event, rol) {
  const { orderId } = event.pathParameters || {};
  const userId = event.requestContext.authorizer.userId;

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }
  const { reason } = body;

  const existing = await getOrderById(orderId);
  if (!existing) {
    return errorResponse(404, 'NOT_FOUND', 'Order not found');
  }

  if (rol === 'CLIENTE' && existing.userId !== userId) {
    return errorResponse(403, 'FORBIDDEN', 'No puedes cancelar pedidos de otro usuario');
  }

  const current = existing.estado || existing.status || 'PENDIENTE';
  if (!CANCELABLE_STATES.includes(current)) {
    return errorResponse(400, 'VALIDATION_ERROR', `Un pedido en estado ${current} ya no se puede cancelar`);
  }

  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: ORDERS_TABLE,
    Key: { orderId, userId: existing.userId },
    UpdateExpression: 'SET estado = :estado, #st = :estado, updatedAt = :now',
    ExpressionAttributeNames: { '#st': 'status' },
    ExpressionAttributeValues: { ':estado': 'CANCELADO', ':now': now }
  }));

  await publishOrderCancelled({
    orderId,
    userId: existing.userId,
    reason: reason || 'No especificada'
  });

  return successResponse(200, { orderId, estado: 'CANCELADO', status: 'CANCELADO', updatedAt: now });
}

module.exports = {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateStatusHandler,
  cancelOrderHandler
};
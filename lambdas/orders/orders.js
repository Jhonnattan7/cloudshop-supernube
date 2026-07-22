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

async function getOrderById(orderId) {
  const result = await docClient.send(new QueryCommand({
    TableName: ORDERS_TABLE,
    KeyConditionExpression: 'orderId = :orderId',
    ExpressionAttributeValues: { ':orderId': orderId }
  }));
  return (result.Items && result.Items[0]) || null;
}

async function createOrderHandler(event) {
  const userId = event.requestContext.authorizer.userId;
  const email = event.requestContext.authorizer.email;

  const cartItems = await getCartItems(userId);
  if (cartItems.length === 0) {
    return errorResponse(400, 'VALIDATION_ERROR', 'El carrito esta vacio');
  }

  const orderItems = [];
  let total = 0;

  // Se valida stock/existencia contra Catalog en tiempo real
  for (const cartItem of cartItems) {
    const product = await getProductById(cartItem.productId);

    if (!product || product.activo === false) {
      return errorResponse(400, 'VALIDATION_ERROR', `El producto ${cartItem.productId} ya no esta disponible`);
    }
    if (product.inventario < cartItem.quantity) {
      return errorResponse(400, 'VALIDATION_ERROR', `Inventario insuficiente para ${product.nombre}`);
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

  const orderId = `ord_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const order = {
    orderId,
    userId,
    email,
    items: orderItems,
    total,
    estado: 'PENDIENTE',
    createdAt: now,
    updatedAt: now
  };

  await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: order }));

  await publishOrderCreated({
    orderId,
    userId,
    email,
    items: orderItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    total
  });

  await clearCartItems(userId);

  return successResponse(201, order);
}

async function listOrdersHandler(event, rol) {
  const userId = event.requestContext.authorizer.userId;
  const qs = event.queryStringParameters || {};

  const filters = [];
  const values = {};

  if (rol === 'CLIENTE') {
    filters.push('userId = :userId');
    values[':userId'] = userId;
  } else if (qs.userId) {
    filters.push('userId = :userId');
    values[':userId'] = qs.userId;
  }

  if (qs.estado) {
    filters.push('estado = :estado');
    values[':estado'] = qs.estado;
  }

  const params = { TableName: ORDERS_TABLE };
  if (filters.length > 0) {
    params.FilterExpression = filters.join(' AND ');
    params.ExpressionAttributeValues = values;
  }

  const result = await docClient.send(new ScanCommand(params));

  return successResponse(200, { orders: result.Items || [] });
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

  const current = existing.estado;
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
    UpdateExpression: 'SET estado = :estado, updatedAt = :now',
    ExpressionAttributeValues: { ':estado': estado, ':now': now }
  }));

  return successResponse(200, { orderId, estado, updatedAt: now });
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

  if (!CANCELABLE_STATES.includes(existing.estado)) {
    return errorResponse(400, 'VALIDATION_ERROR', `Un pedido en estado ${existing.estado} ya no se puede cancelar`);
  }

  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: ORDERS_TABLE,
    Key: { orderId, userId: existing.userId },
    UpdateExpression: 'SET estado = :estado, updatedAt = :now',
    ExpressionAttributeValues: { ':estado': 'CANCELADO', ':now': now }
  }));

  await publishOrderCancelled({
    orderId,
    userId: existing.userId,
    reason: reason || 'No especificada'
  });

  return successResponse(200, { orderId, estado: 'CANCELADO', updatedAt: now });
}

module.exports = {
  createOrderHandler,
  listOrdersHandler,
  getOrderHandler,
  updateStatusHandler,
  cancelOrderHandler
};
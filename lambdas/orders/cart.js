const { QueryCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');
const { successResponse, errorResponse } = require('./response');
const { getProductById } = require('./catalogClient');

const CART_TABLE = process.env.CART_TABLE;

async function getCartItems(userId) {
  const result = await docClient.send(new QueryCommand({
    TableName: CART_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': userId }
  }));
  return result.Items || [];
}

async function getCartHandler(event) {
  const userId = event.requestContext.authorizer.userId;
  const items = await getCartItems(userId);
  return successResponse(200, { userId, items });
}

async function addItemHandler(event) {
  const userId = event.requestContext.authorizer.userId;
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const { productId, quantity } = body;
  if (!productId || typeof quantity !== 'number' || quantity <= 0) {
    return errorResponse(400, 'VALIDATION_ERROR', 'productId and a positive quantity are required');
  }

  // Solo valida que el producto exista y este activo. El stock real se valida
  const product = await getProductById(productId);
  if (!product || product.activo === false) {
    return errorResponse(400, 'VALIDATION_ERROR', 'productId does not reference an active product');
  }

  const existing = await docClient.send(new GetCommand({ TableName: CART_TABLE, Key: { userId, productId } }));
  const now = new Date().toISOString();

  if (existing.Item) {
    const newQuantity = existing.Item.quantity + quantity;
    await docClient.send(new UpdateCommand({
      TableName: CART_TABLE,
      Key: { userId, productId },
      UpdateExpression: 'SET quantity = :quantity, updatedAt = :now',
      ExpressionAttributeValues: { ':quantity': newQuantity, ':now': now }
    }));
    return successResponse(200, { userId, productId, quantity: newQuantity });
  }

  const item = { userId, productId, quantity, addedAt: now, updatedAt: now };
  await docClient.send(new PutCommand({ TableName: CART_TABLE, Item: item }));
  return successResponse(200, item);
}

async function updateItemHandler(event) {
  const userId = event.requestContext.authorizer.userId;
  const { productId } = event.pathParameters || {};
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const { quantity } = body;
  if (typeof quantity !== 'number' || quantity < 0) {
    return errorResponse(400, 'VALIDATION_ERROR', 'quantity must be zero or a positive number');
  }

  if (quantity === 0) {
    // quantity 0 = quitar el producto del carrito
    try {
      await docClient.send(new DeleteCommand({
        TableName: CART_TABLE,
        Key: { userId, productId },
        ConditionExpression: 'attribute_exists(userId)'
      }));
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        return errorResponse(404, 'NOT_FOUND', 'Product not found in cart');
      }
      throw err;
    }
    return successResponse(200, { userId, productId, removed: true });
  }

  try {
    const result = await docClient.send(new UpdateCommand({
      TableName: CART_TABLE,
      Key: { userId, productId },
      UpdateExpression: 'SET quantity = :quantity, updatedAt = :now',
      ConditionExpression: 'attribute_exists(userId)',
      ExpressionAttributeValues: { ':quantity': quantity, ':now': new Date().toISOString() },
      ReturnValues: 'ALL_NEW'
    }));
    return successResponse(200, result.Attributes);
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return errorResponse(404, 'NOT_FOUND', 'Product not found in cart');
    }
    throw err;
  }
}

async function removeItemHandler(event) {
  const userId = event.requestContext.authorizer.userId;
  const { productId } = event.pathParameters || {};

  try {
    await docClient.send(new DeleteCommand({
      TableName: CART_TABLE,
      Key: { userId, productId },
      ConditionExpression: 'attribute_exists(userId)'
    }));
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      return errorResponse(404, 'NOT_FOUND', 'Product not found in cart');
    }
    throw err;
  }

  return successResponse(200, { userId, productId, removed: true });
}

async function clearCartItems(userId) {
  const items = await getCartItems(userId);
  for (const item of items) {
    await docClient.send(new DeleteCommand({ TableName: CART_TABLE, Key: { userId, productId: item.productId } }));
  }
}

async function clearCartHandler(event) {
  const userId = event.requestContext.authorizer.userId;
  await clearCartItems(userId);
  return successResponse(200, { userId, items: [] });
}

module.exports = {
  getCartHandler,
  addItemHandler,
  updateItemHandler,
  removeItemHandler,
  clearCartHandler,
  getCartItems,
  clearCartItems
};
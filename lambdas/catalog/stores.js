const crypto = require('crypto');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');
const { successResponse, errorResponse } = require('./response');

const STORES_TABLE = process.env.STORES_TABLE;

async function createStoreHandler(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const { nombre, descripcion } = body;

  if (!nombre) {
    return errorResponse(400, 'VALIDATION_ERROR', 'nombre is required');
  }

  const storeId = `store_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const store = {
    storeId,
    nombre,
    descripcion: descripcion || '',
    activo: true,
    createdAt: now,
    updatedAt: now
  };

  await docClient.send(new PutCommand({ TableName: STORES_TABLE, Item: store }));

  return successResponse(201, store);
}

// Solo devuelve tiendas activas
async function listStoresHandler() {
  const result = await docClient.send(new ScanCommand({
    TableName: STORES_TABLE,
    FilterExpression: 'activo = :activo',
    ExpressionAttributeValues: { ':activo': true }
  }));

  return successResponse(200, { stores: result.Items || [] });
}

// Devuelve la tienda aunque este inactiva (para que ADMIN pueda revisarla)
async function getStoreHandler(event) {
  const { storeId } = event.pathParameters || {};

  const result = await docClient.send(new GetCommand({
    TableName: STORES_TABLE,
    Key: { storeId }
  }));

  if (!result.Item) {
    return errorResponse(404, 'NOT_FOUND', 'Store not found');
  }

  return successResponse(200, result.Item);
}

async function updateStoreHandler(event) {
  const { storeId } = event.pathParameters || {};
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const existing = await docClient.send(new GetCommand({ TableName: STORES_TABLE, Key: { storeId } }));
  if (!existing.Item) {
    return errorResponse(404, 'NOT_FOUND', 'Store not found');
  }

  const updates = {};
  if (body.nombre !== undefined) updates.nombre = body.nombre;
  if (body.descripcion !== undefined) updates.descripcion = body.descripcion;

  if (Object.keys(updates).length === 0) {
    return errorResponse(400, 'VALIDATION_ERROR', 'No valid fields to update (nombre, descripcion)');
  }

  updates.updatedAt = new Date().toISOString();

  const exprNames = {};
  const exprValues = {};
  for (const k of Object.keys(updates)) {
    exprNames[`#${k}`] = k;
    exprValues[`:${k}`] = updates[k];
  }

  await docClient.send(new UpdateCommand({
    TableName: STORES_TABLE,
    Key: { storeId },
    UpdateExpression: `SET ${Object.keys(updates).map((k) => `#${k} = :${k}`).join(', ')}`,
    ExpressionAttributeNames: exprNames,
    ExpressionAttributeValues: exprValues
  }));

  return successResponse(200, { storeId, ...updates });
}

// Soft delete: no borra la tienda ni sus productos, solo marca activo:false
async function deleteStoreHandler(event) {
  const { storeId } = event.pathParameters || {};

  const existing = await docClient.send(new GetCommand({ TableName: STORES_TABLE, Key: { storeId } }));
  if (!existing.Item) {
    return errorResponse(404, 'NOT_FOUND', 'Store not found');
  }

  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: STORES_TABLE,
    Key: { storeId },
    UpdateExpression: 'SET #activo = :activo, #updatedAt = :updatedAt',
    ExpressionAttributeNames: { '#activo': 'activo', '#updatedAt': 'updatedAt' },
    ExpressionAttributeValues: { ':activo': false, ':updatedAt': now }
  }));

  return successResponse(200, { storeId, activo: false, updatedAt: now });
}

module.exports = {
  createStoreHandler,
  listStoresHandler,
  getStoreHandler,
  updateStoreHandler,
  deleteStoreHandler
};

const crypto = require('crypto');
const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');
const { successResponse, errorResponse } = require('./response');
const { publishProductDeleted } = require('./eventbridge');

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STORES_TABLE = process.env.STORES_TABLE;

// true solo si la tienda existe y esta activa
async function isActiveStore(storeId) {
  const result = await docClient.send(new GetCommand({ TableName: STORES_TABLE, Key: { storeId } }));
  return !!(result.Item && result.Item.activo === true);
}

async function createProductHandler(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const { codigo, nombre, descripcion, categoria, precio, inventario, storeId } = body;

  if (!codigo || !nombre || !descripcion || !categoria || precio === undefined || inventario === undefined || !storeId) {
    return errorResponse(400, 'VALIDATION_ERROR', 'codigo, nombre, descripcion, categoria, precio, inventario and storeId are required');
  }

  if (typeof precio !== 'number' || precio <= 0) {
    return errorResponse(400, 'VALIDATION_ERROR', 'precio must be a positive number');
  }

  if (typeof inventario !== 'number' || inventario < 0) {
    return errorResponse(400, 'VALIDATION_ERROR', 'inventario must be zero or a positive number');
  }

  const storeOk = await isActiveStore(storeId);
  if (!storeOk) {
    return errorResponse(400, 'VALIDATION_ERROR', 'storeId does not reference an active store');
  }

  const productId = `prod_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const product = {
    productId,
    storeId,
    codigo,
    nombre,
    descripcion,
    categoria,
    precio,
    inventario,
    activo: true,
    createdAt: now,
    updatedAt: now
  };

  await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: product }));

  return successResponse(201, product);
}

// Filtros opcionales por query string: ?categoria=... y/o ?storeId=...
async function listProductsHandler(event) {
  const { categoria, storeId } = event.queryStringParameters || {};

  const filters = [];
  const values = {};

  if (categoria) {
    filters.push('categoria = :categoria');
    values[':categoria'] = categoria;
  }
  if (storeId) {
    filters.push('storeId = :storeId');
    values[':storeId'] = storeId;
  }

  const params = { TableName: PRODUCTS_TABLE };
  if (filters.length > 0) {
    params.FilterExpression = filters.join(' AND ');
    params.ExpressionAttributeValues = values;
  }

  const result = await docClient.send(new ScanCommand(params));

  return successResponse(200, { products: result.Items || [] });
}

async function getProductHandler(event) {
  const { productId } = event.pathParameters || {};

  const result = await docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: { productId } }));

  if (!result.Item) {
    return errorResponse(404, 'NOT_FOUND', 'Product not found');
  }

  return successResponse(200, result.Item);
}

// Rol ya validado por index.js, solo resuelve el alcance según el rol
async function updateProductHandler(event, rol) {
  const { productId } = event.pathParameters || {};
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const existing = await docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: { productId } }));
  if (!existing.Item) {
    return errorResponse(404, 'NOT_FOUND', 'Product not found');
  }

  const bodyKeys = Object.keys(body);
  const updates = {};

  if (rol === 'OPERADOR') {
    // Si manda algún campo distinto a "inventario", se rechaza la peticion completa
    const onlyInventario = bodyKeys.length > 0 && bodyKeys.every((k) => k === 'inventario');
    if (!onlyInventario) {
      return errorResponse(
        403,
        'FORBIDDEN',
        "OPERADOR solo puede actualizar el campo 'inventario'. Elimina los demás campos del body e intenta de nuevo."
      );
    }
    if (typeof body.inventario !== 'number' || body.inventario < 0) {
      return errorResponse(400, 'VALIDATION_ERROR', 'inventario must be zero or a positive number');
    }
    updates.inventario = body.inventario;
  } else {
    // ADMIN puede tocar cualquier campo del producto
    const allowedFields = ['codigo', 'nombre', 'descripcion', 'categoria', 'precio', 'inventario', 'storeId', 'activo'];
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(400, 'VALIDATION_ERROR', 'No valid fields to update');
    }

    if (updates.precio !== undefined && (typeof updates.precio !== 'number' || updates.precio <= 0)) {
      return errorResponse(400, 'VALIDATION_ERROR', 'precio must be a positive number');
    }
    if (updates.inventario !== undefined && (typeof updates.inventario !== 'number' || updates.inventario < 0)) {
      return errorResponse(400, 'VALIDATION_ERROR', 'inventario must be zero or a positive number');
    }
    // Si cambia de tienda, se revalida igual que en el create
    if (updates.storeId !== undefined) {
      const storeOk = await isActiveStore(updates.storeId);
      if (!storeOk) {
        return errorResponse(400, 'VALIDATION_ERROR', 'storeId does not reference an active store');
      }
    }
  }

  updates.updatedAt = new Date().toISOString();

  const exprNames = {};
  const exprValues = {};
  for (const k of Object.keys(updates)) {
    exprNames[`#${k}`] = k;
    exprValues[`:${k}`] = updates[k];
  }

  await docClient.send(new UpdateCommand({
    TableName: PRODUCTS_TABLE,
    Key: { productId },
    UpdateExpression: `SET ${Object.keys(updates).map((k) => `#${k} = :${k}`).join(', ')}`,
    ExpressionAttributeNames: exprNames,
    ExpressionAttributeValues: exprValues
  }));

  return successResponse(200, { productId, ...updates });
}

// Hard delete + emite PRODUCT_DELETED; Events Service escribe la auditoria
async function deleteProductHandler(event) {
  const { productId } = event.pathParameters || {};
  const deletedBy = event.requestContext?.authorizer?.userId;

  const existing = await docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: { productId } }));
  if (!existing.Item) {
    return errorResponse(404, 'NOT_FOUND', 'Product not found');
  }

  await docClient.send(new DeleteCommand({ TableName: PRODUCTS_TABLE, Key: { productId } }));

  await publishProductDeleted({
    productId,
    nombre: existing.Item.nombre,
    deletedBy
  });

  return successResponse(200, { productId, deleted: true });
}

module.exports = {
  createProductHandler,
  listProductsHandler,
  getProductHandler,
  updateProductHandler,
  deleteProductHandler
};

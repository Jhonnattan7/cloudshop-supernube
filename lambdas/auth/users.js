const { ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');
const { successResponse, errorResponse } = require('./response');

const USERS_TABLE = process.env.USERS_TABLE;

async function listUsersHandler() {
  const result = await docClient.send(new ScanCommand({ TableName: USERS_TABLE }));
  const users = (result.Items || []).map((u) => {
    const { password, ...safeUser } = u;
    return safeUser;
  });
  return successResponse(200, { usuarios: users });
}

async function updateUserHandler(event) {
  const { id } = event.pathParameters || {};
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }

  const { rol, activo, nombre } = body;
  const updateExprs = [];
  const exprValues = {};
  const exprNames = {};

  if (rol) {
    updateExprs.push('#r = :rol');
    exprValues[':rol'] = rol.toUpperCase();
    exprNames['#r'] = 'rol';
  }
  if (typeof activo === 'boolean') {
    updateExprs.push('activo = :activo');
    exprValues[':activo'] = activo;
  }
  if (nombre) {
    updateExprs.push('nombre = :nombre');
    exprValues[':nombre'] = nombre;
  }

  updateExprs.push('updatedAt = :now');
  exprValues[':now'] = new Date().toISOString();

  const params = {
    TableName: USERS_TABLE,
    Key: { userId: id },
    UpdateExpression: 'SET ' + updateExprs.join(', '),
    ExpressionAttributeValues: exprValues
  };
  if (Object.keys(exprNames).length > 0) {
    params.ExpressionAttributeNames = exprNames;
  }

  await docClient.send(new UpdateCommand(params));
  return successResponse(200, { userId: id, updated: true });
}

async function deleteUserHandler(event) {
  const { id } = event.pathParameters || {};
  const now = new Date().toISOString();

  await docClient.send(new UpdateCommand({
    TableName: USERS_TABLE,
    Key: { userId: id },
    UpdateExpression: 'SET activo = :activo, updatedAt = :now',
    ExpressionAttributeValues: { ':activo': false, ':now': now }
  }));

  return successResponse(200, { userId: id, activo: false, updatedAt: now });
}

module.exports = { listUsersHandler, updateUserHandler, deleteUserHandler };

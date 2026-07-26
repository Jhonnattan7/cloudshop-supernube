const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { ScanCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');
const { successResponse, errorResponse } = require('./response');

const USERS_TABLE = process.env.USERS_TABLE;
const AUDIT_TABLE = process.env.AUDIT_TABLE;

async function registerHandler(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }
  const { email, password, nombre } = body;

  if (!email || !password || !nombre) {
    return errorResponse(400, 'VALIDATION_ERROR', 'email, password and nombre are required');
  }

  const existing = await docClient.send(new ScanCommand({
    TableName: USERS_TABLE,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email }
  }));

  if (existing.Items && existing.Items.length > 0) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = `usr_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const user = {
    userId,
    email,
    password: passwordHash,
    nombre,
    rol: (body.rol && ['ADMIN', 'OPERADOR', 'CLIENTE'].includes(body.rol.toUpperCase())) ? body.rol.toUpperCase() : 'CLIENTE',
    activo: true,
    createdAt: now,
    updatedAt: now
  };

  await docClient.send(new PutCommand({ TableName: USERS_TABLE, Item: user }));

  await docClient.send(new PutCommand({
    TableName: AUDIT_TABLE,
    Item: {
      auditId: `aud_${crypto.randomUUID()}`,
      timestamp: now,
      usuario: userId,
      accion: 'CREAR_USUARIO',
      resultado: 'EXITOSO'
    }
  }));

  return successResponse(201, {
    userId,
    email,
    nombre,
    rol: 'CLIENTE',
    activo: true,
    createdAt: now
  });
}

module.exports = { registerHandler };

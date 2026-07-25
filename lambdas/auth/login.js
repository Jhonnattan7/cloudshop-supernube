const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');
const { successResponse, errorResponse } = require('./response');

const USERS_TABLE = process.env.USERS_TABLE;
const JWT_SECRET = process.env.JWT_SECRET;

async function loginHandler(event) {
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request body');
  }
  const { email, password } = body;

  if (!email || !password) {
    return errorResponse(400, 'VALIDATION_ERROR', 'email and password are required');
  }

  const result = await docClient.send(new ScanCommand({
    TableName: USERS_TABLE,
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email }
  }));

  const user = result.Items && result.Items[0];

  // mismo error generico si no existe, si esta desactivado o si el password no matchea
  // asi no revelamos el estado de la cuenta
  if (!user || !user.activo) {
    return errorResponse(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return errorResponse(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const token = jwt.sign(
    { userId: user.userId, email: user.email, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return successResponse(200, {
    token,
    userId: user.userId,
    rol: user.rol,
    nombre: user.nombre,
    expiresIn: 3600
  });
}

module.exports = { loginHandler };

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function buildPolicy(principalId, effect, resource, context) {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource
        }
      ]
    },
    context
  };
}

exports.handler = async (event) => {
  const authHeader = event.authorizationToken || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new Error('Unauthorized');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // el authorizer solo valida el token, el 403 por rol lo maneja cada lambda de servicio
    // email se reenvia porque ya viene validado en el JWT: evita que otros servicios
    // necesiten permiso de lectura sobre la tabla users
    const resourceArn = event.methodArn ? event.methodArn.split('/').slice(0, 2).join('/') + '/*/*' : '*';
    return buildPolicy(decoded.userId, 'Allow', resourceArn, {
      userId: decoded.userId,
      rol: decoded.rol,
      email: decoded.email
    });
  } catch (err) {
    throw new Error('Unauthorized');
  }
};

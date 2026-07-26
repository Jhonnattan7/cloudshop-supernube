const { registerHandler } = require('./register');
const { loginHandler } = require('./login');
const { listUsersHandler, updateUserHandler, deleteUserHandler } = require('./users');
const { errorResponse } = require('./response');

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
        },
        body: ''
      };
    }

    if (event.resource === '/auth/register' && event.httpMethod === 'POST') {
      return await registerHandler(event);
    }

    if (event.resource === '/auth/login' && event.httpMethod === 'POST') {
      return await loginHandler(event);
    }

    if (event.resource === '/usuarios' && event.httpMethod === 'GET') {
      return await listUsersHandler(event);
    }

    if (event.resource === '/usuarios/{id}' && event.httpMethod === 'PUT') {
      return await updateUserHandler(event);
    }

    if (event.resource === '/usuarios/{id}' && event.httpMethod === 'DELETE') {
      return await deleteUserHandler(event);
    }

    return errorResponse(404, 'NOT_FOUND', 'Route not found');
  } catch (err) {
    console.error(err);
    return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
};

const { registerHandler } = require('./register');
const { loginHandler } = require('./login');
const { errorResponse } = require('./response');

exports.handler = async (event) => {
  try {
    if (event.resource === '/auth/register' && event.httpMethod === 'POST') {
      return await registerHandler(event);
    }

    if (event.resource === '/auth/login' && event.httpMethod === 'POST') {
      return await loginHandler(event);
    }

    return errorResponse(404, 'NOT_FOUND', 'Route not found');
  } catch (err) {
    console.error(err);
    return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
};

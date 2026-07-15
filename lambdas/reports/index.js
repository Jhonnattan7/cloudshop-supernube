const { buildDashboard } = require('./dashboard');
const { successResponse, errorResponse } = require('./response');

exports.handler = async (event) => {
  try {
    if (event.resource === '/reports/dashboard' && event.httpMethod === 'GET') {
      
      const rol = event.requestContext?.authorizer?.rol;

      if (rol !== 'ADMIN') {
        return errorResponse(403, 'FORBIDDEN', 'Only ADMIN can access the executive dashboard');
      }

      const dashboard = await buildDashboard();
      return successResponse(200, dashboard);
    }

    return errorResponse(404, 'NOT_FOUND', 'Route not found');
  } catch (err) {
    console.error(err);
    return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
};

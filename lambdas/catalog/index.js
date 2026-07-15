const {
  createStoreHandler,
  listStoresHandler,
  getStoreHandler,
  updateStoreHandler,
  deleteStoreHandler
} = require('./stores');

const {
  createProductHandler,
  listProductsHandler,
  getProductHandler,
  updateProductHandler,
  deleteProductHandler
} = require('./products');

const { errorResponse } = require('./response');

function forbidden(message) {
  return errorResponse(403, 'FORBIDDEN', message);
}

exports.handler = async (event) => {
  try {
    const rol = event.requestContext?.authorizer?.rol;
    const { resource, httpMethod } = event;

    // --- Stores (docs/security/roles-matrix.md) ---

    if (resource === '/stores' && httpMethod === 'POST') {
      if (rol !== 'ADMIN') return forbidden('Only ADMIN can create stores');
      return await createStoreHandler(event);
    }

    if (resource === '/stores' && httpMethod === 'GET') {
      // ADMIN, OPERADOR y CLIENTE pueden listar tiendas activas
      return await listStoresHandler();
    }

    if (resource === '/stores/{storeId}' && httpMethod === 'GET') {
      return await getStoreHandler(event);
    }

    if (resource === '/stores/{storeId}' && httpMethod === 'PUT') {
      if (rol !== 'ADMIN') return forbidden('Only ADMIN can update stores');
      return await updateStoreHandler(event);
    }

    if (resource === '/stores/{storeId}' && httpMethod === 'DELETE') {
      if (rol !== 'ADMIN') return forbidden('Only ADMIN can deactivate stores');
      return await deleteStoreHandler(event);
    }

    // --- Products (docs/security/roles-matrix.md) ---

    if (resource === '/products' && httpMethod === 'POST') {
      if (rol !== 'ADMIN') return forbidden('Only ADMIN can create products');
      return await createProductHandler(event);
    }

    if (resource === '/products' && httpMethod === 'GET') {
      return await listProductsHandler(event);
    }

    if (resource === '/products/{productId}' && httpMethod === 'GET') {
      return await getProductHandler(event);
    }

    if (resource === '/products/{productId}' && httpMethod === 'PUT') {
      // El alcance de cada rol se resuelve dentro de updateProductHandler
      if (rol !== 'ADMIN' && rol !== 'OPERADOR') return forbidden('Only ADMIN or OPERADOR can update products');
      return await updateProductHandler(event, rol);
    }

    if (resource === '/products/{productId}' && httpMethod === 'DELETE') {
      if (rol !== 'ADMIN') return forbidden('Only ADMIN can delete products');
      return await deleteProductHandler(event);
    }

    return errorResponse(404, 'NOT_FOUND', 'Route not found');
  } catch (err) {
    console.error(err);
    return errorResponse(500, 'INTERNAL_ERROR', 'Unexpected server error');
  }
};

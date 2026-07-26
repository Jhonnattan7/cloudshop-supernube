const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');

const ORDERS_TABLE = process.env.ORDERS_TABLE;
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STORES_TABLE = process.env.STORES_TABLE;

const TOP_N = 10;

async function scanAll(tableName) {
  let items = [];
  let lastEvaluatedKey;

  do {
    const result = await docClient.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: lastEvaluatedKey
    }));
    items = items.concat(result.Items || []);
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}

async function buildDashboard() {
  const [orders, products, stores] = await Promise.all([
    scanAll(ORDERS_TABLE),
    scanAll(PRODUCTS_TABLE),
    scanAll(STORES_TABLE)
  ]);

  const productById = new Map(products.map((p) => [p.productId, p]));
  const storeNameById = new Map(stores.map((s) => [s.storeId, s.nombre || s.name || s.storeId]));

  const ventasValidas = orders.filter((o) => {
    const st = (o.estado || o.status || 'PENDIENTE').toUpperCase();
    return st !== 'CANCELADO';
  });

  const totalVentas = ventasValidas.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const ventasPorTienda = {};
  const cantidadPorProducto = {};

  for (const order of ventasValidas) {
    for (const item of order.items || []) {
      const product = productById.get(item.productId);
      const storeId = product ? product.storeId : (item.storeId || 'store-001');
      const storeName = storeNameById.get(storeId) || storeId;
      const subtotal = Number(item.subtotal ?? item.subTotal ?? ((item.precioUnitario ?? item.precio ?? item.price ?? 0) * (item.quantity || 1))) || Number(order.total || 0);

      ventasPorTienda[storeName] = (ventasPorTienda[storeName] || 0) + subtotal;
      if (item.productId) {
        cantidadPorProducto[item.productId] = (cantidadPorProducto[item.productId] || 0) + (item.quantity || 1);
      }
    }
  }

  const productosMasVendidos = Object.entries(cantidadPorProducto)
    .map(([productId, cantidadVendida]) => ({
      productId,
      nombre: productById.get(productId)?.nombre || productById.get(productId)?.name || productId,
      cantidadVendida
    }))
    .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
    .slice(0, TOP_N);

  const productosAgotados = products
    .filter((p) => p.activo !== false && Number(p.inventario ?? p.inventory ?? 0) <= 0)
    .map((p) => ({ productId: p.productId, nombre: p.nombre || p.name, storeId: p.storeId }));

  const comprasPorCliente = {};
  for (const order of ventasValidas) {
    const key = order.userId;
    if (!comprasPorCliente[key]) {
      comprasPorCliente[key] = { userId: key, totalGastado: 0, cantidadPedidos: 0 };
    }
    comprasPorCliente[key].totalGastado += Number(order.total || 0);
    comprasPorCliente[key].cantidadPedidos += 1;
  }

  const clientesConMasCompras = Object.values(comprasPorCliente)
    .sort((a, b) => b.totalGastado - a.totalGastado)
    .slice(0, TOP_N);

  const pedidosPorEstado = orders.reduce((acc, o) => {
    const st = (o.estado || o.status || 'PENDIENTE').toUpperCase();
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  return {
    totalVentas,
    ventasPorTienda: Object.entries(ventasPorTienda).map(([tienda, total]) => ({ tienda, total })),
    productosMasVendidos,
    productosAgotados,
    clientesConMasCompras,
    pedidosPorEstado
  };
}

module.exports = { buildDashboard };

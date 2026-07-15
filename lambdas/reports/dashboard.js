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
  const storeNameById = new Map(stores.map((s) => [s.storeId, s.nombre]));

  const ventasValidas = orders.filter((o) => o.estado !== 'CANCELADO');

  const totalVentas = ventasValidas.reduce((sum, o) => sum + (o.total || 0), 0);

  const ventasPorTienda = {};
  const cantidadPorProducto = {};

  for (const order of ventasValidas) {
    for (const item of order.items || []) {
      const product = productById.get(item.productId);
      const storeId = product ? product.storeId : 'DESCONOCIDA';
      const storeName = storeNameById.get(storeId) || storeId;
      const precioUnitario = item.precio ?? item.price ?? 0;
      const subtotal = precioUnitario * (item.quantity || 0);

      ventasPorTienda[storeName] = (ventasPorTienda[storeName] || 0) + subtotal;
      cantidadPorProducto[item.productId] = (cantidadPorProducto[item.productId] || 0) + (item.quantity || 0);
    }
  }

  const productosMasVendidos = Object.entries(cantidadPorProducto)
    .map(([productId, cantidadVendida]) => ({
      productId,
      nombre: productById.get(productId)?.nombre || productId,
      cantidadVendida
    }))
    .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
    .slice(0, TOP_N);

  const productosAgotados = products
    .filter((p) => p.activo !== false && (p.inventario ?? 0) <= 0)
    .map((p) => ({ productId: p.productId, nombre: p.nombre, storeId: p.storeId }));

  const comprasPorCliente = {};
  for (const order of ventasValidas) {
    const key = order.userId;
    if (!comprasPorCliente[key]) {
      comprasPorCliente[key] = { userId: key, totalGastado: 0, cantidadPedidos: 0 };
    }
    comprasPorCliente[key].totalGastado += order.total || 0;
    comprasPorCliente[key].cantidadPedidos += 1;
  }

  const clientesConMasCompras = Object.values(comprasPorCliente)
    .sort((a, b) => b.totalGastado - a.totalGastado)
    .slice(0, TOP_N);

  const pedidosPorEstado = orders.reduce((acc, o) => {
    acc[o.estado] = (acc[o.estado] || 0) + 1;
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

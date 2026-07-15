const { writeAudit } = require('./audit');
const { sendOrderConfirmationEmail } = require('./ses');
const { decrementInventory } = require('./inventory');
const { publishInventoryUpdated } = require('./eventbridge');

async function handleOrderCreated(detail) {
  const { orderId, userId, email, items = [], total } = detail;

  for (const item of items) {
    try {
      const { previousStock, newStock } = await decrementInventory(item.productId, item.quantity);

      await publishInventoryUpdated({
        productId: item.productId,
        previousStock,
        newStock,
        orderId
      });

      await writeAudit({
        usuario: userId,
        accion: 'ACTUALIZAR_INVENTARIO',
        resultado: 'EXITOSO',
        detail: { productId: item.productId, previousStock, newStock, orderId }
      });
    } catch (err) {
      console.error(`No se pudo actualizar inventario del producto ${item.productId}`, err);
      await writeAudit({
        usuario: userId,
        accion: 'ACTUALIZAR_INVENTARIO',
        resultado: 'FALLIDO',
        detail: { productId: item.productId, orderId, error: err.message }
      });
    }
  }

  await writeAudit({
    usuario: userId,
    accion: 'CREAR_PEDIDO',
    resultado: 'EXITOSO',
    detail: { orderId, total }
  });

  if (email) {
    try {
      await sendOrderConfirmationEmail({ toEmail: email, orderId, total });
    } catch (err) {
      console.error(`No se pudo enviar el correo de confirmacion del pedido ${orderId}`, err);
    }
  } else {
    console.warn(`ORDER_CREATED sin "email" en el detail, no se envia correo (pedido ${orderId})`);
  }
}

async function handleOrderCancelled(detail) {
  const { orderId, userId, reason } = detail;

  await writeAudit({
    usuario: userId,
    accion: 'CANCELAR_PEDIDO',
    resultado: 'EXITOSO',
    detail: { orderId, reason }
  });
}

async function handleProductDeleted(detail) {
  const { productId, nombre, deletedBy } = detail;

  await writeAudit({
    usuario: deletedBy,
    accion: 'ELIMINAR_PRODUCTO',
    resultado: 'EXITOSO',
    detail: { productId, nombre }
  });
}

async function handleUserCreated(detail) {
  const { userId, email, rol } = detail;

  await writeAudit({
    usuario: userId,
    accion: 'CREAR_USUARIO',
    resultado: 'EXITOSO',
    detail: { email, rol }
  });
}

exports.handler = async (event) => {
  const detailType = event['detail-type'];
  const detail = event.detail || {};

  console.log(`Procesando evento ${detailType}`, JSON.stringify(detail));

  switch (detailType) {
    case 'ORDER_CREATED':
      return handleOrderCreated(detail);
    case 'ORDER_CANCELLED':
      return handleOrderCancelled(detail);
    case 'PRODUCT_DELETED':
      return handleProductDeleted(detail);
    case 'USER_CREATED':
      return handleUserCreated(detail);
    default:

      console.warn(`Tipo de evento no reconocido: ${detailType}`);
      return;
  }
};

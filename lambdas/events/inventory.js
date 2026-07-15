const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;

async function decrementInventory(productId, quantity) {
  const before = await docClient.send(new GetCommand({
    TableName: PRODUCTS_TABLE,
    Key: { productId }
  }));

  if (!before.Item) {
    throw new Error(`Producto ${productId} no encontrado`);
  }

  const result = await docClient.send(new UpdateCommand({
    TableName: PRODUCTS_TABLE,
    Key: { productId },
    UpdateExpression: 'SET inventario = inventario - :qty, updatedAt = :now',
    ConditionExpression: 'inventario >= :qty',
    ExpressionAttributeValues: {
      ':qty': quantity,
      ':now': new Date().toISOString()
    },
    ReturnValues: 'ALL_NEW'
  }));

  return {
    previousStock: before.Item.inventario,
    newStock: result.Attributes.inventario
  };
}

module.exports = { decrementInventory };

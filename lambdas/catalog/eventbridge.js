const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const client = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

// source/detail-type deben coincidir con la regla de EventBridge y con lo que espera Events Service
async function publishProductDeleted({ productId, nombre, deletedBy }) {
  await client.send(new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: 'cloudshop.catalog',
        DetailType: 'PRODUCT_DELETED',
        Detail: JSON.stringify({
          productId,
          nombre,
          deletedBy,
          timestamp: new Date().toISOString()
        })
      }
    ]
  }));
}

module.exports = { publishProductDeleted };

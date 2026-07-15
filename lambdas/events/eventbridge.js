const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const client = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

async function publishInventoryUpdated({ productId, previousStock, newStock, orderId }) {
  await client.send(new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: 'cloudshop.events',
        DetailType: 'INVENTORY_UPDATED',
        Detail: JSON.stringify({
          productId,
          previousStock,
          newStock,
          orderId,
          timestamp: new Date().toISOString()
        })
      }
    ]
  }));
}

module.exports = { publishInventoryUpdated };

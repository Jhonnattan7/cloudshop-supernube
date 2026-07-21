const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const client = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

async function publishOrderCreated({ orderId, userId, email, items, total }) {
  await client.send(new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: 'cloudshop.orders',
        DetailType: 'ORDER_CREATED',
        Detail: JSON.stringify({
          orderId,
          userId,
          email,
          items,
          total,
          timestamp: new Date().toISOString()
        })
      }
    ]
  }));
}

async function publishOrderCancelled({ orderId, userId, reason }) {
  await client.send(new PutEventsCommand({
    Entries: [
      {
        EventBusName: EVENT_BUS_NAME,
        Source: 'cloudshop.orders',
        DetailType: 'ORDER_CANCELLED',
        Detail: JSON.stringify({
          orderId,
          userId,
          reason,
          timestamp: new Date().toISOString()
        })
      }
    ]
  }));
}

module.exports = { publishOrderCreated, publishOrderCancelled };
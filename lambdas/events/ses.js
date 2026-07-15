const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({});
const SENDER_EMAIL = process.env.SENDER_EMAIL;

async function sendOrderConfirmationEmail({ toEmail, orderId, total }) {
  await sesClient.send(new SendEmailCommand({
    Source: SENDER_EMAIL,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: `Confirmación de pedido ${orderId}` },
      Body: {
        Text: {
          Data: `Tu pedido ${orderId} fue confirmado. Total: $${total}.`
        }
      }
    }
  }));
}

module.exports = { sendOrderConfirmationEmail };
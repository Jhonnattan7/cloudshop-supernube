const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const client = new LambdaClient({});
const CATALOG_FUNCTION_NAME = process.env.CATALOG_FUNCTION_NAME;

async function getProductById(productId) {
  const fakeEvent = {
    resource: '/products/{productId}',
    httpMethod: 'GET',
    pathParameters: { productId }
  };

  const result = await client.send(new InvokeCommand({
    FunctionName: CATALOG_FUNCTION_NAME,
    Payload: JSON.stringify(fakeEvent)
  }));

  const payload = JSON.parse(Buffer.from(result.Payload).toString('utf-8'));

  if (result.FunctionError) {
    throw new Error(`Catalog invoke failed: ${result.FunctionError}`);
  }

  if (payload.statusCode === 404) {
    return null;
  }

  if (payload.statusCode >= 400) {
    throw new Error(`Catalog invoke returned ${payload.statusCode}: ${payload.body}`);
  }

  return JSON.parse(payload.body);
}

module.exports = { getProductById };
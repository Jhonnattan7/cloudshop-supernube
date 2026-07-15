const crypto = require('crypto');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('./db');

const AUDIT_TABLE = process.env.AUDIT_TABLE;

async function writeAudit({ usuario, accion, resultado, detail }) {
  await docClient.send(new PutCommand({
    TableName: AUDIT_TABLE,
    Item: {
      auditId: `aud_${crypto.randomUUID()}`,
      timestamp: new Date().toISOString(),
      usuario,
      accion,
      resultado,
      detail: detail || {}
    }
  }));
}

module.exports = { writeAudit };
require('dotenv').config();

const { RelayClient } = require('@openzeppelin/defender-relay-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new RelayClient(creds);

  const relayerKey = await client.createKey('58b3d255-e357-4b0d-aa16-e86f745e63b9');

  console.log(relayerKey);
}

if (require.main === module) {
  main().catch(console.error);
}

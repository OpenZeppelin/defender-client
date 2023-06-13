require('dotenv').config();

const { RelayClient } = require('@openzeppelin/defender-relay-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new RelayClient(creds);

  const currentRelayer = await client.get('58b3d255-e357-4b0d-aa16-e86f745e63b9');
  console.log(currentRelayer);
  const updatedRelayer = await client.update(currentRelayer.relayerId, { name: 'Test 2' });
  console.log(updatedRelayer);
}

if (require.main === module) {
  main().catch(console.error);
}

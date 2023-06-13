require('dotenv').config();

const { SentinelClient } = require('@openzeppelin/defender-sentinel-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new SentinelClient(creds);

  const currentSentinel = await client.get('58b3d255-e357-4b0d-aa16-e86f745e63b9');
  console.log(currentSentinel);
  const updatedSentinel = await client.update(currentSentinel.subscriberId, { name: 'Test 2' });
  console.log(updatedSentinel);
}

if (require.main === module) {
  main().catch(console.error);
}

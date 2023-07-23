require('dotenv').config();

const { SentinelClient } = require('@openzeppelin/defender-sentinel-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new SentinelClient(creds);
  const networks = await client.listNetworks({ networkType: 'production' });
  console.log(networks);
}

if (require.main === module) {
  main().catch(console.error);
}

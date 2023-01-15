require('dotenv').config();

const { PlatformClient } = require('platform-deploy-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = PlatformClient(creds);

  console.log('client', client);

  // for sample funcitonality see: https://gist.github.com/dylankilkenny/f2205cda0328c8211da42a9b28e69718
}

if (require.main === module) {
  main().catch(console.error);
}

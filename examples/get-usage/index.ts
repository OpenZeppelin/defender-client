require('dotenv').config();

const { AccountClient } = require('@openzeppelin/defender-account-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };

  const client = new AccountClient(creds);

  // List Account Usage
  const usage = await client.getUsage();

  console.log(usage);
}

if (require.main === module) {
  main().catch(console.error);
}

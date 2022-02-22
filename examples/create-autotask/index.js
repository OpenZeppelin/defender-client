require('dotenv').config();

const { AutotaskClient } = require('defender-autotask-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new AutotaskClient(creds);

  console.log(client);

  const autotasks = await client.list();
  console.log(autotasks);
}

if (require.main === module) {
  main().catch(console.error);
}

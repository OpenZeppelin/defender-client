require('dotenv').config();

const { AutotaskClient } = require('@openzeppelin/defender-autotask-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new AutotaskClient(creds);

  const createSecrets = await client.createSecrets({ deletes: [], secrets: { foo: 'bar' } });
  console.log(createSecrets);
}

if (require.main === module) {
  main().catch(console.error);
}

require('dotenv').config();

const { AutotaskClient } = require('@openzeppelin/defender-autotask-client');

async function main() {
  // Gather autotaskId and api key
  const autotaskId = process.argv[2];
  if (!autotaskId) throw new Error(`AutotaskId missing`);

  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new AutotaskClient(creds);

  // Update Variables
  const currentVariables = await client.getEnvironmentVariables(autotaskId);
  console.log('current environment variables', currentVariables);

  // Update Variables
  const variables = await client.updateEnvironmentVariables(autotaskId, { hello: 'world!', test: '123' });
  console.log('updated environment variables', variables);
}

if (require.main === module) {
  main().catch(console.error);
}

require('dotenv').config();

const { AutotaskClient } = require('@openzeppelin/defender-autotask-client');

async function main() {
  // Gather autotaskId and api key
  const autotaskId = process.argv[2];
  if (!autotaskId) throw new Error(`AutotaskId missing`);

  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new AutotaskClient(creds);

  // Update Variables
  const updated = await client.updateEnvironmentVariables(autotaskId, { hello: 'world!', test: '123' });
  console.log(updated.message);

  // Retrieve autotask and display environment variables
  const autotask = await client.get(autotaskId);
  console.log(`New Autotask Environment Variables:`);
  console.log(autotask.environmentVariables);
}

if (require.main === module) {
  main().catch(console.error);
}

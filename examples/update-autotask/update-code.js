require('dotenv').config();

const { AutotaskClient } = require('defender-autotask-client');

async function main() {
  // Gather autotaskId and api key
  const autotaskId = process.argv[2];
  if (!autotaskId) throw new Error(`AutotaskId missing`);
  const { TEAM_API_KEY: apiKey, TEAM_API_SECRET: apiSecret } = process.env;
  if (!apiKey || !apiSecret) throw new Error(`Team API Key missing`);
  console.log(apiKey)
  console.log(apiSecret)

  // Setup client
  const client = new AutotaskClient({ apiKey, apiSecret });

  // Update code
  await client.updateCodeFromFolder(autotaskId, './code');
  console.log(`Autotask code updated!`);
}

if (require.main === module) {
  main().catch(console.error);
}

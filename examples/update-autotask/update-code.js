require('dotenv').config();

const { AutotaskClient } = require('@openzeppelin/defender-autotask-client');

async function main() {
  // Gather autotaskId and api key
  const autotaskId = process.argv[2];
  if (!autotaskId) throw new Error(`AutotaskId missing`);
  const { TEAM_API_KEY: apiKey, TEAM_API_SECRET: apiSecret } = process.env;
  if (!apiKey || !apiSecret) throw new Error(`Team API Key missing`);

  // Setup client
  const client = new AutotaskClient({ apiKey, apiSecret });

  // Get new code digest
  const code = await client.getEncodedZippedCodeFromFolder('./code');
  const newDigest = client.getCodeDigest(code);

  // Get existing one
  const { codeDigest } = await client.get(autotaskId);

  // Update code only if changed
  if (newDigest === codeDigest) {
    console.log(`Code digest matches (skipping upload)`);
  } else {
    await client.updateCodeFromFolder(autotaskId, './code');
    console.log(`Autotask code updated`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

require('dotenv').config();

const { AutotaskClient } = require('@openzeppelin/defender-autotask-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new AutotaskClient(creds);

  const myAutotask = {
    name: 'my-autotask',
    encodedZippedCode: await client.getEncodedZippedCodeFromFolder('./code'),
    trigger: {
      type: 'schedule',
      frequencyMinutes: 1500,
    },
    paused: false,
  };

  const createdAutotask = await client.create(myAutotask);
  console.log(createdAutotask);
}

if (require.main === module) {
  main().catch(console.error);
}

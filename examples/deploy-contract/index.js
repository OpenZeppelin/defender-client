require('dotenv').config();

const { PlatformClient } = require('platform-deploy-client');

const artifactFile = require('./artifacts/Box.json');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new PlatformClient(creds);

  await client.BlockExplorerApiKey.create({
    network: 'goerli',
    key: 'AAABBBCCC...', // Add your Block Explorer API Key here
  });

  const keys = await client.BlockExplorerApiKey.list();
  console.log(keys);

  // Get approval process for deployment on Goerli
  const config = await client.Deployment.getApprovalProcess('goerli');
  console.log(config);

  const deployment = await client.Deployment.deploy({
    contractName: 'Box',
    contractPath: 'contracts/Box.sol',
    network: 'goerli',
    artifactPayload: JSON.stringify(artifactFile),
    licenseType: 'MIT',
    verifySourceCode: true,
  });

  const deploymentStatus = await client.Deployment.get(deployment.deploymentId);
  console.log(deploymentStatus);
}

if (require.main === module) {
  main().catch(console.error);
}

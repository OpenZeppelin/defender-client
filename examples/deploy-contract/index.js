require('dotenv').config();

const { PlatformClient } = require('platform-deploy-client');

const artifactFile = require('./artifacts/Box.json');

async function main() {
    const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
    const client = new PlatformClient(creds);


    await client.DeploymentConfig.create({
        relayerId: "1234-abcd-..." // Add your Relayer ID here
    });

    const configs = await client.DeploymentConfig.list();
    console.log(configs);

    await client.BlockExplorerApiKey.create({
        network: "goerli",
        key: "AAABBBCCC..." // Add your Block Explorer API Key here
    });

    const keys = await client.BlockExplorerApiKey.list();
    console.log(keys);

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

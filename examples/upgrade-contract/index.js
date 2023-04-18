require('dotenv').config();

const { PlatformClient } = require('platform-deploy-client');

const abiFile = require('./abis/Box.json');


async function main() {
    const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
    const client = new PlatformClient(creds);

    // Get approval process for upgrade on Goerli
    const config = await client.Upgrade.getApprovalProcess("goerli");
    console.log(config);

    const upgrade = await client.Upgrade.upgrade({
        proxyAddress: "0xABC1234...",
        proxyAdminAddress: "0xDEF1234...",
        newImplementationABI: JSON.stringify(abiFile),
        newImplementationAddress: "0xABCDEF1....",
        network: 'goerli',
    });

    console.log(upgrade);
}

if (require.main === module) {
    main().catch(console.error);
}

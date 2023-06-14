require('dotenv').config();

const { PlatformClient } = require('@openzeppelin/platform-deploy-client');

const boxAbiFile = require('./abis/Box.json');
// const tokenAbiFile = require('./abis/Box.json');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new PlatformClient(creds);

  // Get approval process for deployment on Sepolia
  const config = await client.Upgrade.getApprovalProcess('sepolia');
  console.log(config);

  const upgrade = await client.Upgrade.upgrade({
    proxyAddress: '0xABC1234...',
    proxyAdminAddress: '0xDEF1234...',
    newImplementationABI: JSON.stringify(boxAbiFile),
    newImplementationAddress: '0xABCDEF1....',
    network: 'sepolia',
  });

  console.log(upgrade);
}

if (require.main === module) {
  main().catch(console.error);
}

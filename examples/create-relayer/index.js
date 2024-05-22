require('dotenv').config();

const { RelayClient } = require('@openzeppelin/defender-relay-client');

async function main() {
  const client = new RelayClient({
    apiKey: process.env.ADMIN_API_KEY,
    apiSecret: process.env.ADMIN_API_SECRET,
    useCredentialsCaching: false,
  });

  const createParams = {
    name: 'MyNewRelayer',
    network: 'sepolia',
    minBalance: BigInt(1e17).toString(),
    policies: {
      whitelistReceivers: ['0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'],
    },
  };

  const relayer = await client.create(createParams);

  console.log(relayer);
}

if (require.main === module) {
  main().catch(console.error);
}

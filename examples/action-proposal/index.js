require('dotenv').config();

const { AdminClient } = require('defender-admin-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new AdminClient(creds);

  const proposal = await client.createProposal({
    contract: {
      address: '0xf62322658Cb0F51C71Da36637a6846B0967cA264',
      network: 'rinkeby',
    },
    title: 'Set to 42',
    description: 'Set value to 42',
    type: 'custom',
    functionInterface: { name: 'setNumber', inputs: [{ name: '_value', type: 'uint256' }] },
    functionInputs: ['42'],
    via: '0xF608FA64c4fF8aDdbEd106E69f3459effb4bC3D1',
    viaType: 'Gnosis Safe',
  });

  console.log(proposal.url);
}

if (require.main === module) {
  main().catch(console.error);
}

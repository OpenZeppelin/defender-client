require('dotenv').config();

const { AdminClient } = require('defender-admin-client');

const address = '0xB07b1C80371915dEFd254d1C57BeF2bDe6D3b610';
const network = 'rinkeby';

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new AdminClient(creds);

  const proposal = await client.proposeUnpause({ title: 'Unpause contract' }, { network, address });
  const siteUrl = process.env.SITE_URL || 'https://defender.openzeppelin.com';
  console.log(`${siteUrl}/#/admin/contracts/${proposal.contractId}/proposals/${proposal.proposalId}`);
}

if (require.main === module) {
  main().catch(console.error);
}

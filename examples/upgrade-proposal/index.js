require('dotenv').config();

const { AdminClient } = require('@openzeppelin/defender-admin-client');

const proxy = '0xB07b1C80371915dEFd254d1C57BeF2bDe6D3b610';
const newImplementation = '0x86690db6c757fcc71ff1b69cf24529e5ab6481fb';
const newImplementationAbi =
  '[{"inputs":[{"internalType":"string","name":"newValue","type":"string"}],"name":"changeValue","outputs":[],"stateMutability":"nonpayable","type":"function"}]'; // If no newImplementationAbi is provided the previous implementation ABI will be assumed
const network = 'goerli';

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new AdminClient(creds);

  const proposal = await client.proposeUpgrade(
    { newImplementation, newImplementationAbi },
    { network, address: proxy },
  );
  const siteUrl = process.env.SITE_URL || 'https://defender.openzeppelin.com';
  console.log(`${siteUrl}/#/admin/contracts/${proposal.contractId}/proposals/${proposal.proposalId}`);
}

if (require.main === module) {
  main().catch(console.error);
}

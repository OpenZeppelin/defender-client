require('dotenv').config();

const { AdminClient } = require('defender-admin-client');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };

  console.log('creds', creds);

  const client = new AdminClient(creds);

  const verification = await client.verify({
    artifactUri: 'https://raw.githubusercontent.com/OpenZeppelin/defender-client/fa441208febac7f46fe7bb03c787659089315f78/examples/verify-contract/compilation-artifact.json',
    solidityFilePath: 'contracts/Vault.sol',
    contractName: 'VaultV2',
    contractAddress: '0x38e373CC414e90dDec45cf7166d497409902e998',
    contractNetwork: 'rinkeby'
  });

  console.log('Verification result: ', verification.matchType);
  console.log('Compilation artifact: ', verification.artifactUri);
  console.log('Network: ', verification.contractNetwork);
  console.log('Contract address: ', verification.contractAddress);
  console.log('SHA256 of bytecode on chain: ', verification.onChainSha256);
  console.log('SHA256 of provided compilation artifact: ', verification.providedSha256);
  console.log('Compilation artifact provided by: ', verification.providedBy);
  console.log('Last verified: ', verification.lastVerifiedAt);  
}

if (require.main === module) {
  main().catch(console.error);
}

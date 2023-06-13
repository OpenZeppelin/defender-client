require('dotenv').config();

const { AdminClient } = require('@openzeppelin/defender-admin-client');

function printVerificationToConsole(verification) {
  if (verification) {
    console.log('Verification result: ', verification.matchType);
    console.log('Compilation artifact: ', verification.artifactUri);
    console.log('Network: ', verification.contractNetwork);
    console.log('Contract address: ', verification.contractAddress);
    console.log('SHA256 of bytecode on chain: ', verification.onChainSha256);
    console.log('SHA256 of provided compilation artifact: ', verification.providedSha256);
    console.log('Compilation artifact provided by: ', verification.providedBy);
    console.log('Last verified: ', verification.lastVerifiedAt);
  } else {
    console.log('No verifications available for this contract');
  }
  console.log();
}

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };

  const client = new AdminClient(creds);

  // You can get Defender to verify your compilation output matches
  // the deployed bytecode by calling `verify` with an artifact URI
  console.log(`Verifying deployment using uploaded artifact`);
  let verification = await client.verifyDeployment({
    artifactUri:
      'https://raw.githubusercontent.com/OpenZeppelin/defender-client/fa441208febac7f46fe7bb03c787659089315f78/examples/verify-contract/compilation-artifact.json',
    solidityFilePath: 'contracts/Vault.sol',
    contractName: 'VaultV2',
    contractAddress: '0x38e373CC414e90dDec45cf7166d497409902e998',
    contractNetwork: 'goerli',
  });

  printVerificationToConsole(verification);

  // Or you can get Defender to verify your compilation output matches
  // the deployed bytecode by calling `verify` with the payload inline
  console.log(`Verifying deployment with inline artifact`);
  verification = await client.verifyDeployment({
    artifactPayload: JSON.stringify(require('./compilation-artifact.json')),
    referenceUri:
      'https://github.com/OpenZeppelin/defender-client/blob/master/examples/verify-contract/compilation-artifact.json',
    solidityFilePath: 'contracts/Vault.sol',
    contractName: 'VaultV2',
    contractAddress: '0x38e373CC414e90dDec45cf7166d497409902e998',
    contractNetwork: 'goerli',
  });

  printVerificationToConsole(verification);

  // Or, if you just want to query the current verification
  // state of your contract, you can call `get` providing
  // the address and network
  verification = await client.getDeploymentVerification({
    contractAddress: '0x38e373CC414e90dDec45cf7166d497409902e998',
    contractNetwork: 'goerli',
  });

  printVerificationToConsole(verification);
}

if (require.main === module) {
  main().catch(console.error);
}

require('dotenv').config();

const { AdminClient } = require('defender-admin-client');
const { utils } = require('ethers')

const contractABI = require('./abi/demoflash.json');

async function main() {
  const creds = { apiKey: process.env.ADMIN_API_KEY, apiSecret: process.env.ADMIN_API_SECRET };
  const client = new AdminClient(creds);

  // Create a new proposal
  const proposal = await client.createProposal({
    contract: {
      address: '0xA91382E82fB676d4c935E601305E5253b3829dCD',
      network: 'mainnet',
    },
    title: 'Flash',
    description: 'Call the Flash() function',
    type: 'custom',
    metadata: {
      sendTo: "0xA91382E82fB676d4c935E601305E5253b3829dCD",
      sendValue: "10000000000000000",
      sendCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        type: 'native',
      },
    },
    functionInterface: { name: 'flash', inputs: [] },
    functionInputs: [],
    via: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    viaType: 'EOA',
  });

  console.log(`Created proposal (${proposal.proposalId})`)

  const contractInterface = new utils.Interface(contractABI);

  // encode function data
  const data = contractInterface.encodeFunctionData(proposal.functionInterface.name, proposal.functionInputs)

  // Simulate the proposal
  const simulation = await client.simulateProposal(
    proposal.contractId, // contractId
    proposal.proposalId, // proposalId
    {
      transactionData: {
        from: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", // change this to impersonate the `from` address
        type: "function-call", // or 'send-funds'
        data,
        to: proposal.contract.address,
        value: proposal.metadata.sendValue
      },
      // default to latest finalized block, 
      // can be up to 100 blocks ahead of current block, 
      // does not support previous blocks
      blockNumber: undefined
    }
  );

  console.log(simulation);
}

if (require.main === module) {
  main().catch(console.error);
}

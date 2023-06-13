const { ethers } = require('ethers');
const { DefenderRelaySigner } = require('@openzeppelin/defender-relay-client/lib/ethers');

// ABIs for jobs and registry (contain only the methods needed, not the full ABIs of the contracts)
const ABIs = {
  UniswapV2SlidingOracle: [
    {
      inputs: [],
      name: 'workable',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
    { inputs: [], name: 'work', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  ],
  HegicPoolKeep3r: [
    {
      inputs: [],
      name: 'workable',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
    { inputs: [], name: 'claimRewards', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  ],
  YearnV1EarnKeep3r: [
    { inputs: [], name: 'work', outputs: [], stateMutability: 'nonpayable', type: 'function' },
    {
      inputs: [],
      name: 'workable',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
  ],
  Registry: [
    {
      inputs: [{ internalType: 'address', name: '', type: 'address' }],
      name: 'keepers',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: 'bonding', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'bond',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        { internalType: 'address', name: '', type: 'address' },
        { internalType: 'address', name: '', type: 'address' },
      ],
      name: 'bondings',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'address', name: 'bonding', type: 'address' }],
      name: 'activate',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ],
};

// Definition for all jobs to execute
const Jobs = [
  {
    name: 'UniswapV2SlidingOracle',
    address: '0xd20b88Ca8bF84Ca829f7A9Cf0eC64e2bFE91c204',
    workableFn: 'workable',
    workFn: 'work',
  },
  {
    name: 'HegicPoolKeep3r',
    address: '0x5DDe926b0A31346f2485900C5e64c2577F43F774',
    workableFn: 'workable',
    workFn: 'claimRewards',
  },
  {
    name: 'YearnV1EarnKeep3r',
    address: '0xe7F4ab593aeC81EcA754Da1B3B7cE0C42a13Ec0C',
    workableFn: 'workable',
    workFn: 'work',
  },
];

// Address for the Keeper registry
const RegistryAddress = '0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44';

// Use the mainnet
const network = 'homestead';

// Work on jobs if it's needed using a Defender relay signer
async function workIfNeeded(signer, jobs) {
  for (const job of jobs) {
    const contract = new ethers.Contract(job.address, ABIs[job.name], signer);
    if (await contract[job.workableFn]()) {
      console.log(`${job.name} is workable`);
      const tx = await contract[job.workFn]();
      console.log(`${job.name} worked: ${tx.hash}`);
    } else {
      console.log(`${job.name} is not workable`);
    }
  }
}

// Register the Defender relay as a keep3r
async function registerKeeper(signer, registry) {
  const keeperAddress = await signer.getAddress();
  const collateralAddress = registry.address;
  const bonding = await registry.bondings(keeperAddress, collateralAddress);

  if (bonding.isZero()) {
    // Bond with zero KPR tokens
    const collateralAmount = '0x00';
    const tx = await registry.bond(collateralAddress, collateralAmount);
    console.log(`Bonded relayer: ${tx.hash}`);
  } else if (bonding.lt(parseInt(Date.now() / 1000))) {
    // Activate if 3-day waiting period has finished
    const tx = await registry.activate(collateralAddress);
    console.log(`Activated relayer: ${tx.hash}`);
  } else {
    // Wait until can activate
    const waitInSeconds = bonding.sub(parseInt(Date.now() / 1000)).toString();
    console.log(`Waiting ${waitInSeconds} seconds until activation is available`);
  }
}

// Main function
async function main(signer, jobs, registryAddress) {
  const keeperAddress = await signer.getAddress();
  const registry = new ethers.Contract(registryAddress, ABIs.Registry, signer);

  // Work if this is a registered keeper, or register it otherwise
  if (await registry.keepers(keeperAddress)) {
    await workIfNeeded(signer, jobs);
  } else {
    await registerKeeper(signer, registry);
  }
}

// Entrypoint for the Autotask
exports.handler = async function (credentials) {
  // Connect to mainnet with a Project ID and Project Secret
  provider = new ethers.providers.InfuraProvider('homestead', {
    infuraProjectId: credentials.infuraProjectId,
    infuraProjectSecret: credentials.infuraProjectSecret,
  });
  const signer = new DefenderRelaySigner(credentials, provider, { speed: 'fastest' });
  return await main(signer, Jobs, RegistryAddress);
};

// To run locally (this code will not be executed in Autotasks)
if (require.main === module) {
  require('dotenv').config();
  const {
    API_KEY: apiKey,
    API_SECRET: apiSecret,
    INFURA_PROJECT_ID: infuraProjectId,
    INFURA_PROJECT_SECRET: infuraProjectSecret,
  } = process.env;
  exports
    .handler({ apiKey, apiSecret, infuraProjectId, infuraProjectSecret })
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

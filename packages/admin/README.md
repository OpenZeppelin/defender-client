# Defender Admin Client

Defender Admin acts as an interface to manage your smart contract project through one or more secure multi-signature contracts. Defender Admin holds no control at all over your system, which is fully controlled by the keys of the signers.

To interact with your contracts, you create _proposals_ that need to be reviewed and approved by the other members of the multi-signature wallets. These proposals can be created directly in the Defender web application, or using this library. You can also rely on this library to add your contracts to the Defender Admin dashboard.

## Install

```bash
npm install defender-admin-client
```

```bash
yarn add defender-admin-client
```

## Usage

Start by creating a new _Team API Key_ in Defender, and granting it the capability to create new proposals. Use the newly created API key to initialize an instance of the Admin client.

```js
const { AdminClient } = require('defender-admin-client');
const client = new AdminClient({ apiKey: API_KEY, apiSecret: API_SECRET });
```

### Action proposals

To create a `custom` action proposal, you need to provide the function interface (which you can extract from the contract's ABI), its inputs, and the multisig that will be used for approving it:

```js
await client.createProposal({
  contract: { address: '0x28a8746e75304c0780E011BEd21C72cD78cd535E', network: 'rinkeby' }, // Target contract
  title: 'Adjust fee to 10%', // Title of the proposal
  description: 'Adjust the contract fee collected per action to 10%', // Description of the proposal
  type: 'custom', // Use 'custom' for custom admin actions
  functionInterface: { name: 'setFee', inputs: [{ type: 'uint256', name: 'fee' }] }, // Function ABI
  functionInputs: ['10'], // Arguments to the function
  via: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', // Address to execute proposal
  viaType: 'Gnosis Safe', // 'Gnosis Safe', 'Gnosis Multisig', or 'EOA'
});
```

#### Issuing DELEGATECALLs

When invoking a function via a Gnosis Safe, it's possible to call it via a `DELEGATECALL` instruction instead of a regular call. This has the effect of executing the code in the called contract _in the context of the multisig_, meaning any operations that affect storage will affect the multisig, and any calls to additional contracts will be executed as if the `msg.sender` were the multisig. To do this, add a `metadata` parameter with the value `{ operationType: 'delegateCall' }` to your `createProposal` call:

```js
await client.createProposal({
  // ... Include all parameters from the example above
  via: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', // Multisig address
  viaType: 'Gnosis Safe', // Must be Gnosis Safe to handle delegate calls
  metadata: { operationType: 'delegateCall' }, // Issue a delegatecall instead of a regular call
});
```

Note that this can potentially brick your multisig, if the contract you delegatecall into accidentally modifies the multisig's storage, rendering it unusable. Make sure you understand the risks before issuing a delegatecall.

### Upgrade proposals

To create an `upgrade` action proposal, provide the proxy contract network and address, along with the new implementation address, and Defender will automatically resolve the rest (note that if no newImplementationAbi is provided the previous implementation ABI will be assumed for the proposal):

```js
const newImplementation = '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9';
const newImplementationAbi = '[...]'
const contract = { network: 'rinkeby', address: '0x28a8746e75304c0780E011BEd21C72cD78cd535E' };
await client.proposeUpgrade({ newImplementation, newImplementationAbi }, contract);
```

If your proxies do not implement the [EIP1967 admin slot](https://eips.ethereum.org/EIPS/eip-1967#admin-address), you will need to provide either the [`ProxyAdmin` contract](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.0.0/contracts/proxy/transparent/ProxyAdmin.sol) or the Account with rights to execute the upgrade, as shown below.

#### Explicit ProxyAdmin

```js
const newImplementation = '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9';
const proxyAdmin = '0x2fC100f1BeA4ACCD5dA5e5ed725D763c90e8ca96';
const newImplementationAbi = '[...]'
const contract = { network: 'rinkeby', address: '0x28a8746e75304c0780E011BEd21C72cD78cd535E' };
await client.proposeUpgrade({ newImplementation, newImplementationAbi, proxyAdmin }, contract);
```

#### Explicit owner account

```js
const newImplementation = '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9';
const via = '0xF608FA64c4fF8aDdbEd106E69f3459effb4bC3D1';
const viaType = 'Gnosis Safe'; // or 'Gnosis Multisig', or 'EOA'
const contract = { network: 'rinkeby', address: '0x28a8746e75304c0780E011BEd21C72cD78cd535E' };
const newImplementationAbi = '[...]'
await client.proposeUpgrade({ newImplementation, newImplementationAbi, via, viaType }, contract);
```

### Pause proposals

To create `pause` and `unpause` action proposals, you need to provide the contract network and address, as well as the multisig that will be used for approving it. Defender takes care of the rest:

```js
const contract = { network: 'rinkeby', address: '0x28a8746e75304c0780E011BEd21C72cD78cd535E' };

// Create a pause proposal
await client.proposePause({ via: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', viaType: 'Gnosis Safe' }, contract);

// Create an unpause proposal
await client.proposeUnpause({ via: '0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b', viaType: 'Gnosis Safe' }, contract);
```

Note that for `pause` and `unpause` proposals to work, your contract ABI must include corresponding `pause()` and `unpause()` functions.

### List proposals

You can list all proposals:

```js
const proposals = await client.listProposals();
```

You can filter your active proposals by `isActive` property present on each proposal in the list response. By default, only unarchived proposals are returned, but you can override this by adding an `includeArchived: true` option in the call.

### Archiving proposals

You can archive or unarchive a proposal given its contract and proposal ids:

```js
await client.archiveProposal(contractId, proposalId);
await client.unarchiveProposal(contractId, proposalId);
```

## Adding Contracts

If you create a new proposal for a Contract that has not yet been added to Defender Admin, it will be automatically added with an autogenerated name and an empty ABI. You can optionally control these values by providing values for them in the `contract` object of the proposal:

```js
const contract = {
  network: 'rinkeby',
  address: '0x28a8746e75304c0780E011BEd21C72cD78cd535E',
  name: 'My contract', // Name of the contract if it is created along with this proposal
  abi: '[...]', // ABI to set for this contract if it is created
};
await client.proposeUpgrade({ newImplementation }, contract);
```

Alternatively, you can add any contract explicitly by using the `addContract` method, and setting network, address, name, natspec and ABI. The same method can be used to update the contract's name or ABI.

```js
await client.addContract({
  network: 'rinkeby',
  address: '0x28a8746e75304c0780E011BEd21C72cD78cd535E',
  name: 'My contract',
  abi: '[...]',
  natSpec: '{devdoc:{...}, userdoc: {...}}'
});
```

You can also list all contracts in your Defender Admin dashboard via `listContracts`.

## FAQ

**Can I use this package in a browser?**

This package is not designed to be used in a browser environment. Using this package requires sensitive API KEYS that should not be exposed publicly.

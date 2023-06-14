# Platform Deployment Client

Platform Deployment Client allows you to deploy contracts through the OpenZeppelin Platform, manage deployment configuration and manage block explorer api keys.

## Install

```bash
npm install platform-deploy-client
```

```bash
yarn add platform-deploy-client
```

## Usage

Start by creating a new _Team API Key_ in Defender, and granting it the capability to manage deployments. Use the newly created API key to initialize an instance of the Deployment client.

You can create instances of the clients using the `PlatformClient` helper function which returns an object with the 4 clients `DeploymentClient`, `DeploymentConfigClient`, `UpgradeClient`, and `BlockExplorerApiKeyClient`.

```js
const { PlatformClient } = require('@openzeppelin/platform-deploy-client');
const client = PlatformClient({ apiKey: API_KEY, apiSecret: API_SECRET });
```

Alternatively you can instantiate whichever client you need individually

```js
const { DeploymentClient } = require('@openzeppelin/platform-deploy-client');
const client = new DeploymentClient({ apiKey: API_KEY, apiSecret: API_SECRET });
```

```js
const { UpgradeClient } = require('@openzeppelin/platform-deploy-client');
const client = new UpgradeClient({ apiKey: API_KEY, apiSecret: API_SECRET });
```

### Deployment

To deploy a contract you need to provide these required fields:

- `network`
- `contractName`
- `contractPath` - The path of your contract in your hardhat project

Additionally you must provide your compilation artifact from hardhat. The compilation artifact can be found in your hardhat project folder at `artifacts/build-info/{build-id}.json`. Either one of these fields are required:

- `artifactPayload` - JSON stringified version of the file
- `artifactUri` - URI to the hosted artifact file

There are a number of optional fields depending on what you are deploying, these include:

- `constructorInputs` - The inputs to your contract constructor,
- `value` - ETH to be sent with the deployment.
- `salt` - deployments are done using the CREATE2 opcode, you can provide a salt or we can generate one for you if none is supplied.
- `licenseType` - This will be displayed on Etherscan e.g MIT.
- `libraries` - If you contract uses any external libraries they will need to be added here in the format `{ [LibraryName]: LibraryAddress }`.
- `relayerId` - This property will override the default relayer assigned to the approval process for deployments. You may define this property if you wish to use a different relayer than the one assigned to the approval process in the deploy environment.

Below is an example of a contract deployment request which responds with a `DeploymentResponse`

```js
await client.Deployment.deploy({
  contractName: 'Greeter',
  contractPath: 'contracts/Greeter.sol',
  network: 'sepolia',
  artifactPayload: JSON.stringify(artifactFile),
  licenseType: 'MIT',
  constructorInputs: ['Hello World!'],
});
```

You can also list your deployments, which will return a `DeploymentResponse[]` object

```js
await client.Deployment.list();
```

As well as fetching a deployment via it's ID

```js
const deploymentId = '8181d9e0-88ce-4db0-802a-2b56e2e6a7b1';
await client.Deployment.get(deploymentId);
```

You can also retrieve the deploy approval process for a given network, which will return a `ApprovalProcessResponse` object

```js
await client.Deployment.getApprovalProcess('sepolia');
```

### Upgrade

To upgrade a contract you need to provide these required fields:

- `proxyAddress`
- `newImplementationAddress`
- `network`

There are a number of optional fields, these include:

- `proxyAdminAddress` - The Proxy Admin address in case you are upgrading with a transparent proxy.
- `newImplementationABI` - The ABI of the new implementation address. This will be required if the implementation contract does not exist in the OpenZeppelin Platform.
- `approvalProcessId` - The approval process ID in case you wish to override the default global approval process.
- `senderAddress` - The address you wish to create the Gnosis proposal with. When creating an upgrade proposal, we provide you with an external link to the Gnosis Safe UI. This will lead you to a proposal ready to be signed. This proposal will contain information about what upgrade to execute, as well as who initiated the proposal. The `senderAddress` property lets you customise define which address this is.

Below is an example of a contract upgrade request which responds with a `UpgradeContractResponse`

```js
await client.Upgrade.upgrade({
  proxyAddress: '0xABC1234...',
  proxyAdminAddress: '0xDEF1234...',
  newImplementationABI: JSON.stringify(boxABIFile),
  newImplementationAddress: '0xABCDEF1....',
  network: 'sepolia',
});
```

You can also retrieve the upgrade approval process for a given network, which will return a `ApprovalProcessResponse` object

```js
await client.Upgrade.getApprovalProcess('sepolia');
```

### Block Explorer Verification

In order to have your contract source code verified on Etherscan you must provide your Etherscan Api Keys along with the network those keys will belong to. If you want to use the same Api Key for 2 different networks, e.g Ethereum Mainnet and Sepolia Testnet, you must add the Api Key for both networks individually.

```js
await client.BlockExplorerApiKey.create({
  key: 'RKI7QAFIZJYAEF45GDSTA9EAEKZFW591D',
  network: 'sepolia',
});
```

You can list your Api Keys, which will return a `BlockExplorerApiKeyResponse[]` object

```js
await client.BlockExplorerApiKey.list();
```

As well as fetching a your Api Key via it's ID

```js
const apiKeyId = '8181d9e0-88ce-4db0-802a-2b56e2e6a7b1';
await client.BlockExplorerApiKey.get(apiKeyId);
```

And updating the Api Key for a given network

```js
const apiKeyId = '8181d9e0-88ce-4db0-802a-2b56e2e6a7b1';
await client.BlockExplorerApiKey.update(apiKeyId, {
  key: 'LDNWOWFNEJ2WEL4WLKNWEF8F2MNWKEF',
});
```

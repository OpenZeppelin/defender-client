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

You can create instances of the clients using the `PlatformClient` helper function which returns an object with the 3 clients `DeploymentClient`, `DeploymentConfigClient` and `BlockExplorerApiKeyClient`.

```js
const { PlatformClient } = require('platform-deploy-client');
const client = PlatformClient({ apiKey: API_KEY, apiSecret: API_SECRET });
```

Alternatively you can instantiate whichever client you need individually

```js
const { DeploymentClient } = require('platform-deploy-client');
const client = new DeploymentClient({ apiKey: API_KEY, apiSecret: API_SECRET });
```

### Deployment Config

To deploy a contract, you will need to create a deployment config. The config consists of the ID belonging to the Relayer you want to use for deployments. You can only specify one deployment config per network, so if you create a config with a Relayer on the `goerli` testnet, all your deployments on `goerli` will be sent via that Relayer.

```js
await client.DeploymentConfig.create({ relayerId: 'dfa8b9a6-0f88-4d28-892a-93e1f5a8d2a7' });
```

You can also list your deployment configs, which will return a `DeploymentConfigResponse[]` object

```js
await client.DeploymentConfig.list();
```

As well as fetching a config via it's ID

```js
const deploymentConfigId = 'e595ce88-f525-4d5d-b4b9-8e859310b6fb';
await client.DeploymentConfig.get(deploymentConfigId);
```

If you want to change the relayer used in a deploy config you can update it

```js
const deploymentConfigId = 'e595ce88-f525-4d5d-b4b9-8e859310b6fb';
await client.DeploymentConfig.update(deploymentConfigId, { relayerId: '3dcfee82-f5bd-43e3-8480-0676e5c28964' });
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
- `value` - ETH to be sent with the deployment
- `salt` - deployments are done using the CREATE2 opcode, you can provide a salt or we can generate one for you if none is supplied
- `licenseType` - This will be displayed on Etherscan e.g MIT
- `libraries` - If you contract uses any external libraries they will need to be added here in the format `{ [LibraryName]: LibraryAddress }`

Below is an example of a contract deployment request which responds with a `DeploymentResponse`

```js
await client.Deployment.deploy({
  contractName: 'Greeter',
  contractPath: 'contracts/Greeter.sol',
  network: 'goerli',
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

### Block Explorer Verification

In order to have your contract source code verified on Etherscan you must provide your Etherscan Api Keys along with the network those keys will belong to. If you want to use the same Api Key for 2 different networks, e.g Ethereum Mainnet and Goerli Testnet, you must add the Api Key for both networks individually.

```js
await client.BlockExplorerApiKey.create({
  key: 'RKI7QAFIZJYAEF45GDSTA9EAEKZFW591D',
  network: 'goerli',
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
  network: 'goerli',
});
```

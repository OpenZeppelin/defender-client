# Defender Autotask Client

The [Defender Autotasks](https://docs.openzeppelin.com/defender/autotasks) service allows you to run small code snippets on a regular basis or via webhooks that can make calls to the Ethereum network or to external APIs. Thanks to tight integration to Defender Relayers, you can use Autotasks to automate regular actions on your contracts.

This client allows you to update the code of your Autotasks programmatically, so you don't need to copy-paste code into the Defender web application.

## Install

```bash
npm install defender-autotask-client
```

```bash
yarn add defender-autotask-client
```

## Usage

Start by creating a new _Team API Key_ in Defender, and granting it the capability to update autotask code. Use the newly created API key to initialize an instance of the Autotask client.

```js
const { AutotaskClient } = require('defender-autotask-client');
const client = new AutotaskClient({apiKey: API_KEY, apiSecret: API_SECRET});
```

### Updating code

To update the Autotask code, you will need the ID of the Autotask to update. You can retrieve it from the _Edit Code_ page of your Autotask, or directly from the URL. For instance, in the following URL, the ID is `19ef0257-bba4-4723-a18f-67d96726213e`.

```
https://defender.openzeppelin.com/#/autotask/19ef0257-bba4-4723-a18f-67d96726213e
```

Your code should include an `index.js` javascript file with an entrypoint, such as the following. You may also `require` other files you include in the bundle.

```js
exports.handler = async function() { /* your code here */ }
```

To upload the code, zip it and upload it using the client:

```js
const zip = fs.readFileSync('code.zip');
await client.updateCodeFromZip(autotaskId, zip);
```

Alternatively, you can also choose a folder to upload, and the client will take care of zipping it and uploading it:

```js
await client.updateCodeFromFolder(autotaskId, './path/to/code');
```

You can also provide the set of files and their content, and the client will generate and upload the zip file for you:
```js
await client.updateCodeFromFolder(autotaskId, {
  'index.js': 'exports.handler = function() { return 42; }'
});
```

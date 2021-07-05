# Defender Autotask Client

The [Defender Autotasks](https://docs.openzeppelin.com/defender/autotasks) service allows you to run small code snippets on a regular basis or via webhooks that can make calls to the Ethereum network or to external APIs. Thanks to tight integration to Defender Relayers, you can use Autotasks to automate regular actions on your contracts.

This client allows you to update the code of your Autotasks programmatically, so you don't need to copy-paste code into the Defender web application.

Example usage:

```bash
$ defender-autotask update-code 19ef0257-bba4-4723-a18f-67d96726213e ./lib/my-autotask
```

## Install

```bash
npm install defender-autotask-client
```

```bash
yarn add defender-autotask-client
```

## Usage

The client can be used either programmatically as part of a script, or directly via the command line. Both uses require a Defender _Team API Key_. Create one on the top-right menu in the Defender web application, and grant to it the capability to manage autotask code.

Keep in mind that your Autotask code should include an `index.js` javascript file with an entrypoint, such as the following. You may also `require` other files you include in the bundle.

```js
exports.handler = async function() { /* your code here */ }
```

Note that you can only use the client to update the code of an existing Autotask. At the moment it is not possible to _create_ new Autotasks from the client - you need to create your Autotasks on the Defender webapp.

### Command line

Set the environment variables `API_KEY` and `API_SECRET` to the Team API key/secret you created on Defender, and invoke the `defender-autotask` bin: 

```bash
$ defender-autotask update-code $AUTOTASK_ID $PATH_TO_CODE
```

Note that the `defender-autotask` CLI will automatically load environment variables from a local `.env` file if found.

### Script usage

Use the Team API key to initialize an instance of the Defender Autotask client:

```js
const { AutotaskClient } = require('defender-autotask-client');
const client = new AutotaskClient({apiKey: API_KEY, apiSecret: API_SECRET});
```

To update the code of an existing Autotask, zip it and upload it using the client, providing the ID of the Autotask to update:

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
await client.updateCodeFromSources(autotaskId, {
  'index.js': 'exports.handler = function() { return 42; }'
});
```

## FAQ

**How do I find the ID of my Autotask?**

You can retrieve it from the _Edit Code_ page of your Autotask, or directly from the URL. For instance, in the following URL, the ID is `19ef0257-bba4-4723-a18f-67d96726213e`.

```
https://defender.openzeppelin.com/#/autotask/19ef0257-bba4-4723-a18f-67d96726213e
```


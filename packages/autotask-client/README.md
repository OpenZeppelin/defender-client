# Defender Autotask Client

The [Defender Autotasks](https://docs.openzeppelin.com/defender/autotasks) service allows you to run small code snippets on a regular basis, via webhooks or from Sentinels that can make calls to the Ethereum network or to external APIs. Thanks to tight integration to Defender Relayers, you can use Autotasks to automate regular actions on your contracts.

This client allows you to update the code of your Autotasks programmatically, so you don't need to copy-paste code into the Defender web application. Additionally, the client allows you to easily create, list, retrieve, delete and update your Autotasks.

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
exports.handler = async function () {
  /* your code here */
};
```

Note that you can only use the client to update the code of an existing Autotask.

### Command line

Set the environment variables `API_KEY` and `API_SECRET` to the Team API key/secret you created on Defender, and invoke the `defender-autotask` bin:

```bash
$ defender-autotask update-code $AUTOTASK_ID $PATH_TO_CODE
$ defender-autotask execute-run $AUTOTASK_ID
$ defender-autotask tail-runs $AUTOTASK_ID
```

Beware that the `defender-autotask` CLI will automatically load environment variables from a local `.env` file if found.

**Note**: In order to get the CLI to work, it should've been installed globally, otherwise, you can prefix with `npx` if you're using it directly on bash. This is not necessary when running from your `package.json` defined scripts.

### Script usage

Use the Team API key to initialize an instance of the Defender Autotask client:

```js
const { AutotaskClient } = require('defender-autotask-client');
const client = new AutotaskClient({ apiKey: API_KEY, apiSecret: API_SECRET });
```

**List**

To list your current autotasks, simply call the `list` function.

```js
await client.list();
```

**Create**

To create a new autotask, construct an `CreateAutotaskRequest` object.

```js
interface CreateAutotaskRequest {
  name: string;
  encodedZippedCode: string;
  relayerId?: string;
  trigger: {
    type: 'schedule' | 'webhook' | 'sentinel',
    frequencyMinutes?: number,
    cron?: string,
  };
  paused: boolean;
}
```

And pass down the object to the `create` function.

```js
const myAutotask: CreateAutotaskRequest = { name: "myAutotask", paused: false, ... };
await client.create(myAutotask);
```

**Retrieve**

To retrieve one of your autotask, call the `get` function with the autotask Id.

```js
await client.get('671d1f80-99e3-4829-aa15-f01e3298e428');
```

**Update**

To update an existing autotask, construct an `UpdateAutotaskRequest` object.

```js
interface UpdateAutotaskRequest {
  autotaskId: string;
  name: string;
  encodedZippedCode?: string;
  relayerId?: string;
  trigger: {
    type: 'schedule' | 'webhook' | 'sentinel',
    frequencyMinutes?: number,
    cron?: string,
  };
  paused: boolean;
}
```

And pass down the object to the `update` function.

```js
const myAutotask: UpdateAutotaskRequest = { name: "myAutotask-V2", paused: true, ... };
await client.update(myAutotask);
```

**Delete**

To delete one of your autotask, call the `delete` function with the autotask Id.

```js
await client.delete('671d1f80-99e3-4829-aa15-f01e3298e428');
```

**Update Code**

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
  'index.js': 'exports.handler = function() { return 42; }',
});
```

**Autotask Runs**

To execute an autotask run, execute the command below substituting the `autotaskId`:

```js
await client.runAutotask(autotaskId);
```

You can list all runs for an autotask with the following command:

```js
await client.listAutotaskRuns(autotaskId);
```

List of all runs can be filtered by status:

```js
await client.listAutotaskRuns(autotaskId, 'error');
```

And get detailed logs for a single run using the `autotaskRunId` (returned in the `listAutotaskRuns` response directly above):

```js
await client.getAutotaskRun(autotaskRunId);
```

## FAQ

**How do I find the ID of my Autotask?**

You can retrieve it from the _Edit Code_ page of your Autotask, or directly from the URL. For instance, in the following URL, the ID is `19ef0257-bba4-4723-a18f-67d96726213e`.

```
https://defender.openzeppelin.com/#/autotask/19ef0257-bba4-4723-a18f-67d96726213e
```

**Can I use this package in a browser?**

This package is not designed to be used in a browser environment. Using this package requires sensitive API KEYS that should not be exposed publicly.

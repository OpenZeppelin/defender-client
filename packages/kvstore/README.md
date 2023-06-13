# Defender Key-Value Store Client for Autotasks

The [Defender Autotasks](https://docs.openzeppelin.com/defender/autotasks) service allows you to run small code snippets on a regular basis or via webhooks that can make calls to the Ethereum network or to external APIs. Thanks to tight integration to Defender Relayers, you can use Autotasks to automate regular actions on your contracts.

This client allows you to access a simple key-value data store from your Autotasks code, so you can persist data throughout executions and across different Autotasks.

_Note that this package will not work outisde the Autotasks environment._

## Installation

This package is included in the Autotask runtime environment, so you do not need to bundle it in your code. To install it for local development and typescript type completion, run:

```bash
npm install @openzeppelin/defender-kvstore-client
```

```bash
yarn add @openzeppelin/defender-kvstore-client
```

## Usage

You can interact with your key-value store through an instance of the `KeyValueStoreClient`, which is initialized with the payload injected in the your Autotask `handler` function. Once initialized, you can `get`, `put`, or `del` key-value pairs from the store.

```js
const { KeyValueStoreClient } = require('@openzeppelin/defender-kvstore-client');

exports.handler = async function (event) {
  // Creates an instance of the key-value store client
  const store = new KeyValueStoreClient(event);

  // Associates myValue to myKey
  await store.put('myKey', 'myValue');

  // Returns myValue associated to myKey
  const value = await store.get('myKey');

  // Deletes the entry for myKey
  await store.del('myKey');
};
```

## Local development

The Defender key-value store is only accessible from within an Autotask. To simplify local development, you can create an instance of a `KeyValueStoreClient` providing an object with a `path` property. The client will use a local json file at that path for all operations.

```js
const { KeyValueStoreClient } = require('@openzeppelin/defender-kvstore-client');

async function local() {
  // Creates an instance of the client that will write to a local file
  const store = new KeyValueStoreClient({ path: '/tmp/foo/store.json' });

  // The store.json file will contain { myKey: myValue }
  await store.put('myKey', 'myValue');
}
```

## Considerations

- All data in the key-value store is persisted as strings, both keys and values.
- Keys are limited to 1kb in size, and values to 300kb.
- The data store is shared across all your Autotasks; consider prefixing the keys with a namespace if you want to have different data buckets.
- A key-value entry is expired after 90 days of the last time it was `put` into the store.
- The total number of key-value records in your store is determined by your Defender plan.

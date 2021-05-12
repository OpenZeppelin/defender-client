# Defender Key-Value Store Client for Autotasks

The [Defender Autotasks](https://docs.openzeppelin.com/defender/autotasks) service allows you to run small code snippets on a regular basis or via webhooks that can make calls to the Ethereum network or to external APIs. Thanks to tight integration to Defender Relayers, you can use Autotasks to automate regular actions on your contracts.

This client allows you to access a simple key-value data store from your Autotasks code, so you can persist data throughout executions and across different Autotasks.

_Note that this package will not work outisde the Autotasks environment._

## Installation

This package is included in the Autotask runtime environment, so you do not need to bundle it in your code. To install it for local development and typescript type completion, run:

```bash
npm install defender-kvstore-client
```

```bash
yarn add defender-kvstore-client
```

## Usage

You can interact with your key-value store through an instance of the `KeyValueStoreClient`, which is initialized with the payload injected in the your Autotask `handler` function. Once initialized, you can `get`, `put`, or `del` key-value pairs from the store.

```js
const { KeyValueStoreClient } = require('defender-kvstore-client');

exports.handler =  async function(event) {
  const store = new KeyValueStoreClient(event);

  // Associates myValue to myKey
  await store.put('myKey', 'myValue');
  
  // Returns myValue associated to myKey
  const value = await store.get('myKey');
  
  // Deletes the entry for myKey
  await store.del('myKey');
}
```

## Considerations

- All data in the key-value store is persisted as strings, both keys and values. 
- The data store is shared across all your Autotasks. Consider prefixing the keys with a namespace if you want to have different data buckets.
- A key-value entry is expired after 90 days of the last time it was `put` into the store.
- The total number of key-value records in your store is determined by your Defender plan.
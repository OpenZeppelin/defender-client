# Defender Relay Client

Defender Relay lets you spin up private relayers to send transactions to any public Ethereum network. Each relayer has its own secure private key, and a set of API keys. You can send transactions via your relayers by POSTing to the Defender HTTP API, or using this library.

This library also includes an ethers.js signer, that uses the Relay to sign and broadcast its transactions.

## Install

```bash
npm install defender-relay-client
```

```bash
yarn add defender-relay-client
```

## Usage

Start by creating a new relayer in Defender for a network of your choice, and write down the API key and secret. Then use them to create a new `Relayer` instance in your code:

```js
import { Relayer } from 'defender-relay-client';
const relayer = new Relayer({apiKey: API_KEY, apiSecret: API_SECRET});
```

And use the relayer instance to send a transaction:

```js
const tx = await relayer.sendTransaction({
  to: '0x6b175474e89094c44da98b954eedeac495271d0f',
  value: '0x16345785d8a0000',
  data: '0x5af3107a',
  speed: 'fast',
  gasLimit: 100000
});
```

The `sendTransaction` call returns once the transaction has been _signed_ by the relayer. To monitor the transaction status, see [Querying](#Querying) below.

### Gas Price
If you know the best gas price for your transaction you can specify it in `sendTransaction` call.

```js
const tx = await relayer.sendTransaction({
  to: '0x6b175474e89094c44da98b954eedeac495271d0f',
  value: '0x16345785d8a0000',
  data: '0x5af3107a',
  gasPrice: 1e7,
  gasLimit: 100000
});
```

Note, `gasPrice` and `speed` can't be set at the same time.

### Speed

Instead of providing a fixed `gasPrice`, the relayer accepts a `speed` parameter that can be one of `safeLow`, `average`, `fast`, or `fastest`. The relayer will determine the gas price based on these values from [ethgasstation](https://ethgasstation.info/), and update it regularly by resubmitting your transaction if it fails to get mined.

### Return data

The returned transaction object `tx` will have the following shape:

```ts
transactionId: string; // Defender transaction identifier
hash: string; // Ethereum transaction hash
to: string; 
from: string;
value: string;
data: string;
gasPrice: number;
gasLimit: number;
nonce: number;
chainId: number;
status: 'pending' | 'sent' | 'submitted' | 'inmempool' | 'mined' | 'confirmed';
speed: 'safeLow' | 'average' | 'fast' | 'fastest';
```

## Querying

The `relayer` object also has a `query` function that returns a transaction object as described above. This method receives the `transactionId`, **not** the transaction `hash`:

```js
const latestTx = await relayer.query(tx.transactionId);
```

Defender will update the transaction `status` every minute, marking it as `confirmed` after 12 confirmations. The transaction information will be stored for 30 days.

### Why querying?

The `query` function is important to monitor the transaction status, since Defender may choose to _resubmit the transaction with a different gas price_, effectively changing its hash. This means that, if you monitor your transaction only via `getTransactionReceipt(tx.hash)` calls to a node, you may not get the latest info if it was replaced.

Defender may replace a transaction by increasing its gas price if it has not been mined for a period of time, and the gas price costs have increased since the transaction was originally submitted. Also, in a case where a transaction consistently fails to be mined, Defender may replace it by a _no-op_ (a transaction with no value or data) in order to advance the sender account nonce.

## Signing

You can sign any hex string (`0x123213`) using a `sign` method of the relayer. Pay attention, that the message has to be a **hex string**.

```js
  const signResponse = await relayer.sign({ message: msg });
```

### Return data

Once your data is signed, the following response will be returned:

```js
export interface SignedMessagePayload {
    sig: Hex;
    r: Hex;
    s: Hex;
    v: number;
}
```

## Ethers.js

You can use the `defender-relay-client` with [ethers.js v5](https://github.com/ethers-io/ethers.js/) directly. The package exports a `DefenderRelaySigner` [signer](https://docs.ethers.io/v5/api/signer/) that is used to send transaction.

Make sure to have `ethers` installed in your project, and initialize a new defender signer instance like:

```js
const { DefenderRelaySigner } = require('defender-relay-client/lib/ethers');
const { ethers } = require('ethers');

const provider = ethers.getDefaultProvider(NETWORK);
const signer = new DefenderRelaySigner(
  API_KEY, 
  API_SECRET, 
  provider, 
  { 
    from: RELAYER_ADDRESS, 
    speed: 'fast' 
  });
```

You can then use it to send any transactions, such as executing a contract function. The `tx` object returned will be a regular ethers.js `TransactionResponse` object, with the addition of Defender's `transactionId` field.

```js
const erc20 = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, signer);
const tx = await erc20.functions.transfer(beneficiary, 1e18.toString());
const mined = await tx.wait();
```


### Signing

`signMessage` method is supported as well, allowing to sign an arbitrary data with a relayer key.

```js
  const sig = await signer.signMessage('Funds are safu!');
```

### Limitations

The current implementation of the `DefenderRelaySigner` for ethers.js has the following limitations:
- The signer requires the relayer sender address that corresponds to the API key to be provided during construction. Future versions will fetch this automatically from Defender.
- Due to validations set up in `ethers.js`, it is not possible to specify the transaction `speed` for an individual transaction when sending it. It must be set during the signer construction, and will be used for all transactions sent through it.
- A `wait` on the transaction to be mined will only wait for the current transaction hash (see [Querying](#Querying)). If Defender Relayer replaces the transaction with a different one, this operation will time out. This is ok for fast transactions, since Defender only reprices after a few minutes. But if you expect the transaction to take a long time to be mined, then ethers' `wait` may not work. Future versions will also include an ethers provider aware of this.

## Using with Autotasks

Defender Autotasks natively support integration with Defender Relay, allowing to send transactions without providing API keys.

In your autotask's code, just `require('defender-relay-client')` and construct a new relayer instance using autotask's event argument—`new Relayer(event)`. This will give you a fully capable of sending transactions relayer object.

```js
const { Relayer } = require('defender-relay-client');

exports.handler =  async function(event, context) {
  const relayer = new Relayer(event);

  const txRes = await relayer.sendTransaction({
    to: '0xc7dd3ff5b387db0130854fe5f141a78586f417c6',
    value: 100,
    speed: 'fast',
    gasLimit: '1000000',
  });
  console.log(txRes);

  return txRes.hash;
}


```

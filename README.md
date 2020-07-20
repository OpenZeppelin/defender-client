# Defender Relay Client

Defender Relay lets you spin up private relayers to send transactions to any public Ethereum network. Each relayer has its own secure private key, and a set of API keys. You can send transactions via your relayers by POSTing to the Defender HTTP API, or using this library.

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
const relayer = new Relayer(API_KEY, API_SECRET);
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

### Speed

Instead of accepting a fixed `gasPrice`, the relayer accepts a `speed` parameter that can be one of `safeLow`, `average`, `fast`, or `fastest`. The relayer will determine the gas price based on these values from [ethgasstation](https://ethgasstation.info/), and update it regularly by resubmitting your transaction if it fails to get mined.

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

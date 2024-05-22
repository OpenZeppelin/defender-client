# Defender Account Client

Defender Account acts as an interface to manage your account.

# End Of Support Notice

We will no longer be maintaining or supporting any additional releases for defender-client. Please migrate to defender-sdk as soon as possible to get all the benefits of defender 2.0 and more.

Please 

## Install

```bash
npm install @openzeppelin/defender-account-client
```

```bash
yarn add @openzeppelin/defender-account-client
```

## Usage

Start by creating a new _Team API Key_ in Defender, and granting it the capability to create new proposals. Use the newly created API key to initialize an instance of the Account client.

```js
const { AccountClient } = require('@openzeppelin/defender-account-client');
const client = new AccountClient({ apiKey: API_KEY, apiSecret: API_SECRET });
```

### Account Usage

To get account usages `getUsage` method can be used:

```js
await client.getUsage();
```

You can optionally set date to get usage for past period. When date is set only subset of quotas connected to the monthly usage is returned.

```js
await client.getUsage({
  date: '2023-10-01'
});
```

You can also optionally set quotas list to get usage only for desired quotas.

```js
await client.getUsage({
  quotas: ['relayers', 'relayerTxPerHour']
});
```

## FAQ

**Can I use this package in a browser?**

This package is not designed to be used in a browser environment. Using this package requires sensitive API KEYS that should not be exposed publicly.

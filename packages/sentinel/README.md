# Defender Sentinel Client

Defender Sentinel allows you to monitor transactions by defining conditions on events, functions, and transaction parameters, and notifying via email, slack, telegram, discord, Autotasks, and more.

Further information can be found on the OpenZeppelin documentation page: https://docs.openzeppelin.com/defender/sentinel

## Install

```bash
npm install defender-sentinel-client
```

```bash
yarn add defender-sentinel-client
```

## Usage

Start by creating a new _Team API Key_ in Defender, and granting it the capability to manage sentinels. Use the newly created API key to initialize an instance of the Sentinel client.

```js
const { SentinelClient } = require('defender-sentinel-client');
const client = new SentinelClient({ apiKey: API_KEY, apiSecret: API_SECRET });
```

### List Sentinels

To list existing sentinels, you can call the `list` function on the client, which returns a `SentinelResponse[]` object:

```js
await client.list();
```

### Create a Notification

A sentinel requires a notification configuration to alert the right channels in case an event is triggered.
In order to do so, you can either use an existing notification ID (from another sentinel for example), or create a new one.

The following notification channels are available:

- email
- slack
- discord
- telegram
- datadog

The `createNotificationChannel` function requires the `NotificationType` and `NotificationRequest` parameters respectively, and returns a `NotificationResponse` object.

```js
const notification = await client.createNotificationChannel('email', {
  name: 'MyEmailNotification',
  config: {
    emails: ['john@example.com'],
  },
  paused: false,
});
```

You can also list existing notification channels:

```js
const notificationChannels = await client.listNotificationChannels();
const { notificationId, type } = notificationChannels[0];
```

This returns a `NotificationResponse[]` object.

### List Blockwatchers

To list blockwatchers, you can call the `listBlockwatchers` function from client. Alternatively, you could retrieve the `blockWatcherId` for a given network by calling `getBlockwatcherIdByNetwork`.

```js
const blockwatchers = await client.listBlockwatchers();
const { blockWatcherId } = await client.getBlockwatcherIdByNetwork('rinkeby')[0];
```

### Create a Sentinel

To create a new sentinel, you need to provide the blockwatcher ID, name, pause-state, address rules, alert threshold and notification configuration. This request is exported as type `CreateSentinelRequest`.

An example is provided below. This sentinel will be named `MyNewSentinel` and will be monitoring the `renounceOwnership` function on the `0x0f06aB75c7DD497981b75CD82F6566e3a5CAd8f2` contract on the Rinkeby network.
The alert threshold is set to 2 times within 1 hour, and the user will be notified via email.

```js
const requestParameters = {
  blockWatcherId,
  name: 'MyNewSentinel',
  paused: false,
  addressRules: [
    {
      conditions: [
        {
          eventConditions: [],
          txConditions: [],
          functionConditions: [
            {
              functionSignature: 'renounceOwnership()',
              expression: undefined,
            },
          ],
        },
      ],
      autotaskCondition: undefined,
      address: '0x0f06aB75c7DD497981b75CD82F6566e3a5CAd8f2',
      abi: '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{...}]',
    },
  ],
  alertThreshold: {
    amount: 2,
    windowSeconds: 3600,
  },
  notifyConfig: {
    notifications: [
      {
        // Or use an existing notification ID and type
        notificationId: notification.notificationId,
        type: notification.type,
      },
    ],
    autotaskId: undefined,
    timeoutMs: 0,
  },
};
```

Once you have these parameters all setup, you can create a sentinel by calling the `create` function on the client. This will return a `SentinelResponse` object.

```js
await client.create(requestParameters);
```

### Retrieve a Sentinel

You can retrieve a sentinel by ID. This will return a `SentinelResponse` object.

```js
await client.get('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1);
```

### Update a Sentinel

To update a sentinel, you can call the `update` function on the client. This will require the sentinel ID and a `CreateSentinelRequest` object as parameters:

```js
await client.update('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1', requestParameters);
```

### Delete a Sentinel

You can delete a sentinel by ID. This will return a `DeletedSentinelResponse` object.

```js
await client.delete('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1);
```

### Pause and unpause a Sentinel

You can pause and unpause a sentinel by ID. This will return a `SentinelResponse` object.

```js
await client.pause('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1);
await client.unpause('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1);
```

### Failed Requests

Failed requests might return the following example response object:

```js
{
  response: {
    status: 404,
    statusText: 'Not Found',
    data: {
      message: 'subscriber with id 8181d9e0-88ce-4db0-802a-2b56e2e6a7b1 not found.'
    }
  },
  message: 'Request failed with status code 404',
  request: {
    path: '/subscribers/8181d9e0-88ce-4db0-802a-2b56e2e6a7b1',
    method: 'GET'
  }
}
```

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

To list existing sentinels, you can call the `list` function on the client, which returns a `CreateSentinelResponse[]` object:

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
- pager-duty
- telegram
- datadog
- webhook
- opsgenie

The `createNotificationChannel` function requires the `NotificationType` and `NotificationRequest` parameters respectively, and returns a `NotificationResponse` object.

```js
const notification = await client.createNotificationChannel('email', {
  name: 'MyEmailNotification',
  config: {
    emails: ['john@example.com'],
  },
  paused: false,
});

const notification = await client.createNotificationChannel('slack', {
  name: 'MySlackNotification',
  config: {
    url: 'https://slack.com/url/key',
  },
  paused: false,
});

const notification = await client.createNotificationChannel('opsgenie', {
  name: 'MyOpsgenieNotification',
  config: {
    apiKey: '123-secret',
    instanceLocation: 'US',
    responders: [{ username: 'emergency@email.io' }],
  },
  paused: false,
});

const notification = await client.createNotificationChannel('telegram', {
  name: 'MyTelegramNotification',
  config: {
    botToken: 'abcd',
    chatId: '123',
  },
  paused: false,
});

const notification = await client.createNotificationChannel('pager-duty', {
  name: 'MyPagerDutyNotification',
  config: {
    token: 'pager-duty-integration-token',
    eventType: 'alert',
    routingKey: 'integration-routing-key',
  },
  paused: false,
});

const notification = await client.createNotificationChannel('discord', {
  name: 'MyDiscordNotification',
  config: {
    url: 'https://discord.com/url/key',
  },
  paused: false,
});

const notification = await client.createNotificationChannel('datadog', {
  name: 'MyDatadogNotification',
  config: {
    apiKey: 'abcd',
    metricPrefix: 'prefix',
  },
  paused: false,
});
```

### List notifications

You can also list existing notification channels:

```js
const notificationChannels = await client.listNotificationChannels();
const { notificationId, type } = notificationChannels[0];
```

This returns a `NotificationResponse[]` object.

### Get a notification

You can also retrieve a single notification channel. The function takes as parameter the `GetNotificationRequest` object, which must include the `type` and `notificationId` properties.

```js
await client.getNotificationChannel({ type: 'email', notificationId: 'e595ce88-f525-4d5d-b4b9-8e859310b6fb' });
```

This returns a `NotificationResponse` object.

### Update a notification

You can also update a single notification channel. The function takes as parameter the `UpdateNotificationRequest` object which must include the `type`, `notificationId` and `NotificationRequest` properties.

```js
await client.updateNotificationChannel({
  type: 'email',
  notificationId: 'e595ce88-f525-4d5d-b4b9-8e859310b6fb',
  name: 'MyUpdatedEmailNotification',
  config: {
    emails: ['johndoe@example.com'],
  },
  paused: false,
});
```

This returns a `NotificationResponse` object.

### Delete a notification

You can also delete a notification channel. The function takes as a parameters the `DeleteNotificationRequest` object which must include the `type` and `notificationId` properties.

```js
await client.deleteNotificationChannel({ type: 'email', notificationId: 'e595ce88-f525-4d5d-b4b9-8e859310b6fb' });
```

### Notification Categories

There are 3 default notification categories.

- High Severity
- Medium Severity
- Low Severity

Each notification category can be associated with up to two notification channels. For instance, the High Severity category can be linked to a Slack channel and a webhook.

A notification category can then be linked to a sentinel. If a sentinel does not have any notification channels assigned and is linked to a category, the notification channels linked to that category will be notified when the sentinel is triggered.

**Note:** If a sentinel has both manually linked notification channels and channels associated with its category, the manually linked channels will take precedence and the category-associated channels will not be used. The sentinel will only notify the manually linked channels.

### List notification categories

You can also list existing notification categories:

```js
const notificationCategories = await client.listNotificationCategories();
const { categoryId, notificationIds } = notificationCategories[0];
```

This request returns a `NotificationCategoryResponse[]` object.

### Get a notification category

You can also retrieve a single notification category.

```js
await client.getNotificationCategory('66a753ae-90ed-4373-a360-1c3f79610d15');
```

This request returns a `NotificationCategoryResponse` object.

### Update a notification category

You can also update a single notification category. The only fields that can be updated are:

- description
- notificationIds

Changing the `name` field is currently not supported. Any changes to the `name` field will be ignored.

```js
const myNotification = await client.getNotificationChannel({
  type: 'email',
  notificationId: 'e595ce88-f525-4d5d-b4b9-8e859310b6fb',
});
await client.updateNotificationCategory({
  categoryId: '66a753ae-90ed-4373-a360-1c3f79610d15',
  name: 'High Severity',
  description: 'Attach this category to high-risk monitors',
  notificationIds: [myNotification],
});
```

This request returns a `NotificationCategoryResponse` object.

### Create a Sentinel

There are two types of sentinels, `BLOCK` and `FORTA`. For more information on when to use which type, have a look at the documentation [https://docs.openzeppelin.com/defender/sentinel#when-to-use](here).

To create a new sentinel, you need to provide the type, network, name, pause-state, conditions, alert threshold and notification configuration. This request is exported as type `CreateSentinelRequest`.

An example for a `BLOCK` sentinel is provided below. This sentinel will be named `MyNewSentinel` and will be monitoring the `renounceOwnership` function on the `0x0f06aB75c7DD497981b75CD82F6566e3a5CAd8f2` contract on the Rinkeby network.
The alert threshold is set to 2 times within 1 hour, and the user will be notified via email.

```js
const requestParameters = {
  type: 'BLOCK',
  network: 'goerli',
  // optional
  confirmLevel: 1, // if not set, we pick the blockwatcher for the chosen network with the lowest offset
  name: 'MyNewSentinel',
  address: '0x0f06aB75c7DD497981b75CD82F6566e3a5CAd8f2',
  abi: '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{...}]',
  // optional
  paused: false,
  // optional
  eventConditions: [],
  // optional
  functionConditions: [{ functionSignature: 'renounceOwnership()' }],
  // optional
  txCondition: 'gasPrice > 0',
  // optional
  autotaskCondition: '3dcfee82-f5bd-43e3-8480-0676e5c28964',
  // optional
  autotaskTrigger: undefined,
  // optional
  alertThreshold: {
    amount: 2,
    windowSeconds: 3600,
  },
  // optional
  alertTimeoutMs: 0,
  notificationChannels: [notification.notificationId],
  // optional
  // notificationChannels take priority over notification categories
  // in this instance, notificationCategoryId will be ignored, unless notificationChannels is empty
  notificationCategoryId: '66a753ae-90ed-4373-a360-1c3f79610d15',
};
```

If you wish to trigger the sentinel based on additional events, you could add another `EventCondition` or `FunctionCondition` object, for example:

```js
functionConditions: [{ functionSignature: 'renounceOwnership()' }],
eventConditions: [
  {
    eventSignature: "OwnershipTransferred(address,address)",
    expression: "\"0xf5453Ac1b5A978024F0469ea36Be25887EA812b5,0x6B9501462d48F7e78Ba11c98508ee16d29a03412\""
  }
]
```

You could also apply a transaction condition by modifying the `txCondition` property:
Possible variables: `value`, `gasPrice`, `maxFeePerGas`, `maxPriorityFeePerGas`, `gasLimit`, `gasUsed`, `to`, `from`, `nonce`, `status` ('success', 'failed' or 'any'), `input`, or `transactionIndex`.

```js
txCondition: 'gasPrice > 0',
```

You can also construct a request for a `FORTA` sentinel as follows:

```js
const requestParameters = {
  type: 'FORTA',
  name: 'MyNewFortaSentinel',
  // optional
  addresses: ['0x0f06aB75c7DD497981b75CD82F6566e3a5CAd8f2'],
  // optional
  // NOTE: Forta have changed the terminology for 'Agent' to 'Detection Bot'.
  // We will continue to refer to them as 'Agents' for now.
  // agentIDs should be a list of your Bot IDs
  agentIDs: ['0x8fe07f1a4d33b30be2387293f052c273660c829e9a6965cf7e8d485bcb871083'],
  fortaConditions: {
    // optional
    alertIDs: undefined, // string[]
    minimumScannerCount: 1, // default is 1
    // optional
    severity: 2, // (unknown=0, info=1, low=2, medium=3, high=4, critical=5)
  },
  // optional
  paused: false,
  // optional
  autotaskCondition: '3dcfee82-f5bd-43e3-8480-0676e5c28964',
  // optional
  autotaskTrigger: undefined,
  // optional
  alertThreshold: {
    amount: 2,
    windowSeconds: 3600,
  },
  // optional
  alertTimeoutMs: 0,
  notificationChannels: [notification.notificationId],
};
```

Once you have these parameters all setup, you can create a sentinel by calling the `create` function on the client. This will return a `CreateSentinelResponse` object.

```js
await client.create(requestParameters);
```

Additionally, the sentinel could invoke an autotask to further evaluate. Documentation around this can be found here: https://docs.openzeppelin.com/defender/sentinel#autotask_conditions.

```js
// If other conditions match, the sentinel will invoke this autotask to further evaluate.
autotaskCondition: '3dcfee82-f5bd-43e3-8480-0676e5c28964',
// Define autotask within the notification configuration
autotaskTrigger: '1abfee11-a5bc-51e5-1180-0675a5b24c61',
```

### Retrieve a Sentinel

You can retrieve a sentinel by ID. This will return a `CreateSentinelResponse` object.

```js
await client.get('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1');
```

### Update a Sentinel

To update a sentinel, you can call the `update` function on the client. This will require the sentinel ID and a `UpdateSentinelRequest` object as parameters:

```js
await client.update('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1', { name: 'My Updated Name', paused: true });
```

### Delete a Sentinel

You can delete a sentinel by ID. This will return a `DeletedSentinelResponse` object.

```js
await client.delete('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1');
```

### Pause and unpause a Sentinel

You can pause and unpause a sentinel by ID. This will return a `CreateSentinelResponse` object.

```js
await client.pause('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1');
await client.unpause('8181d9e0-88ce-4db0-802a-2b56e2e6a7b1');
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

## FAQ

**Can I use this package in a browser?**

This package is not designed to be used in a browser environment. Using this package requires sensitive API KEYS that should not be exposed publicly.

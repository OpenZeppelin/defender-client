# Defender Autotask Utils

The [Defender Autotasks](https://docs.openzeppelin.com/defender/autotasks) service allows you to run small code snippets on a regular basis, via webhooks or from Sentinels that can make calls to the Ethereum network or to external APIs. Thanks to tight integration to Defender Relayers, you can use Autotasks to automate regular actions on your contracts.

This library provides typings for simplifying the writing of Autotask code when using Typescript.

_Note: For programmatically interacting with your Autotasks, such as updating their code from your local workstation, check out the [`defender-autotask-client`](https://www.npmjs.com/package/defender-autotask-client) package_.

## Install

```bash
npm install defender-autotask-utils
```

```bash
yarn add defender-autotask-utils
```

## Typings

This library includes typings for 1) the event payload injected by Defender when invoking an Autotask, and 2) the result expected by Defender from an Autotask when used as a [Sentinel condition](https://docs.openzeppelin.com/defender/sentinel#autotask_conditions).

### `AutotaskEvent`

Event data injected by Defender when invoking an Autotask. Includes credentials for communicating with whitelisted internal services, as well as the main `request` object of type `AutotaskRequestData`. This data contains a main payload that varies depending on the Autotask trigger:

- A generic object representing the HTTP payload when invoked [via webhook](https://docs.openzeppelin.com/defender/autotasks#webhook-handler)
- A list of matches to evaluate as a `SentinelConditionRequest` when invoked as a [Sentinel condition](https://docs.openzeppelin.com/defender/sentinel#autotask_conditions).
- A list of transactions matched by a Sentinel as a `SentinelTriggerEvent` when invoked as [Sentinel notification](https://docs.openzeppelin.com/defender/sentinel#autotask)

Example usage for a Sentinel trigger event:

```typescript
import {
  AutotaskEvent,
  SentinelTriggerEvent,
  SubscriberType,
  BlockTriggerEvent,
  FortaTriggerEvent,
  isTxAlert,
  isBlockAlert,
} from 'defender-autotask-utils';

export async function handler(event: AutotaskEvent) {
  const payload = event.request.body as SentinelTriggerEvent;

  // You can either check the payload type to destructure the correct properties
  if (payload.type == SubscriberType.BLOCK) {
    const { transaction, matchReasons } = payload;
  } else if (payload.type == SubscriberType.FORTA) {
    const { alert, matchReasons } = payload;
  }

  // Or if you know what type of sentinel you'll be using

  // Contract Sentinel
  const contractPayload = event.request.body as BlockTriggerEvent;
  const { transaction, matchReasons } = contractPayload;
  // Forta Sentinel
  const fortaPayload = event.request.body as FortaTriggerEvent;
  const { alert, matchReasons } = fortaPayload;

  // For forta Alerts you can check whether the alert is related to a transaction or a block
  if (isTxAlert(alert)) {
    // Do something here
  } else if (isBlockAlert(alert)) {
    // Do something here
  }

  // Rest of logic...
}
```

### `SentinelConditionResponse`

When invoked as a [Sentinel condition](https://docs.openzeppelin.com/defender/sentinel#autotask_conditions), the Autotask is expected to return the list of matches, refined from the set of potential transactions initially matched by the Sentinel.

```typescript
import {
  AutotaskEvent,
  SentinelConditionRequest,
  SentinelConditionResponse,
  SentinelConditionMatch,
  SubscriberType,
  isTxAlert,
  isBlockAlert,
} from 'defender-autotask-utils';

export async function handler(event: AutotaskEvent): Promise<SentinelConditionResponse> {
  const { events } = event.request.body as SentinelConditionRequest;
  const matches: SentinelConditionMatch[] = [];

  for (const match of events) {
    if (match.type == SubscriberType.BLOCK) {
      // Custom logic to decide whether this tx should be matched by the Sentinel
      if (!shouldMatch(match.transaction)) continue;
    } else if (match.type == SubscriberType.FORTA) {
      // For forta alerts you can check whether the alert is related to a transaction or a block
      if (isTxAlert(match.alert)) {
        // Do something here
      } else if (isBlockAlert(match.alert)) {
        // Do something here
      }
      if (!shouldMatch(match.alert)) continue;
    }
    // Metadata can be any JSON-marshalable object (or undefined)
    matches.push({ hash: match.hash, metadata: { id: 'myCustomId' } });
  }

  return { matches };
}
```

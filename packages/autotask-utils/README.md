# Defender Autotask Utils

The [Defender Autotasks](https://docs.openzeppelin.com/defender/autotasks) service allows you to run small code snippets on a regular basis or via webhooks that can make calls to the Ethereum network or to external APIs. Thanks to tight integration to Defender Relayers, you can use Autotasks to automate regular actions on your contracts.

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
import { AutotaskEvent, SentinelTriggerEvent } from 'defender-autotask-utils';

export async function handler(event: AutotaskEvent) {
  const payload = event.request.body as SentinelTriggerEvent;
  const { transaction, matchReasons } = payload.transaction;
  // ...
}
```

### `SentinelConditionResponse`

When invoked as a [Sentinel condition](https://docs.openzeppelin.com/defender/sentinel#autotask_conditions), the Autotask is expected to return the list of matches, refined from the set of potential transactions initially matched by the Sentinel.

```typescript
import { 
  AutotaskEvent, 
  SentinelConditionRequest, 
  SentinelConditionResponse, 
  SentinelConditionMatch 
} from 'defender-autotask-utils';

export async function handler(event: AutotaskEvent): Promise<SentinelConditionResponse> {
  const { events } = event.request.body as SentinelConditionRequest;
  const matches: SentinelConditionMatch[] = [];
  
  for (const match of events) {
    // Custom logic to decide whether this tx should be matched by the Sentinel
    if (!triggerTx(match)) continue;

    // Metadata can be any JSON-marshalable object (or undefined)
    matches.push({ hash: match.hash, metadata: { "id": "myCustomId" } });
  }

  return { matches }
}
```

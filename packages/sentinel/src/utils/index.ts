import { compact, sortBy, uniqBy } from 'lodash';
import {
  AddressRule,
  Condition,
  ConditionField,
  Conditions,
  ConditionSet,
  Description,
  EventCondition,
  FunctionCondition,
  TxCondition,
} from '../models/subscriber';

import { Interface, EventFragment, FunctionFragment } from '@ethersproject/abi';
import { isTransactionMethod } from '../models/ethers';

// converts to payload for save API
export default function getConditionSets(
  txExpression: string,
  eventConditions: ConditionField[],
  functionConditions: ConditionField[],
): ConditionSet[] {
  const txConds: TxCondition[] = txExpression ? [{ status: 'any', expression: txExpression }] : [];

  const evtConds: EventCondition[] = compact(
    eventConditions.map((ec) => {
      return ec.selected
        ? {
            eventSignature: ec.signature,
            expression: ec.expression,
          }
        : undefined;
    }),
  );

  const funcConds: FunctionCondition[] = compact(
    functionConditions.map((fc) => {
      return fc.selected
        ? {
            functionSignature: fc.signature,
            expression: fc.expression,
          }
        : undefined;
    }),
  );

  // if no conditions, just return empty list
  if (txConds.length == 0 && evtConds.length == 0 && funcConds.length == 0) {
    return [];
  }

  // if only txcondition exists, then return a standalone condition for that
  if (evtConds.length == 0 && funcConds.length == 0) {
    return [
      {
        txConditions: txConds,
        eventConditions: [],
        functionConditions: [],
      },
    ];
  }

  const result: ConditionSet[] = [];
  for (const c of evtConds) {
    result.push({
      txConditions: txConds,
      eventConditions: [c],
      functionConditions: [],
    });
  }
  for (const c of funcConds) {
    result.push({
      txConditions: txConds,
      eventConditions: [],
      functionConditions: [c],
    });
  }

  return result;
}

export function toConditionField(description: Description, condition: Condition): ConditionField {
  const field: ConditionField = {
    description,
    signature: description.format(),
    inputs: description.inputs.map((i) => i.name).filter(Boolean),
    selected: false,
    expression: '',
  };

  if (condition) {
    field.selected = true;
    field.expression = condition.expression || '';
  }

  return field;
}

const bySignature = (e: EventFragment | FunctionFragment): string => e.format();

export function getSentinelConditions(addressRules: AddressRule[]): Conditions {
  let txExpression = '';
  let eventConditions: EventCondition[] = [];
  let functionConditions: FunctionCondition[] = [];
  let abiEvents: EventFragment[] = [];
  let abiFunctions: FunctionFragment[] = [];

  for (const rule of addressRules) {
    const abiInterface = getAbiInterface(rule.abi);

    if (abiInterface) {
      const events = uniqBy(Object.values(abiInterface.events), (e) => e.format());
      const functions = uniqBy(Object.values(abiInterface.functions), (e) => e.format()).filter(isTransactionMethod);

      if (events.length) abiEvents.push(...events);
      if (functions.length) abiFunctions.push(...functions);
    }

    for (const condition of rule.conditions) {
      for (const cond of condition.txConditions) {
        if (cond.expression) txExpression = cond.expression;
      }

      eventConditions = eventConditions.concat(condition.eventConditions);
      functionConditions = functionConditions.concat(condition.functionConditions);
    }
  }

  abiEvents = sortBy(abiEvents, bySignature);
  abiFunctions = sortBy(abiFunctions, bySignature);

  return {
    txExpression,
    events: abiEvents.map((event) =>
      toConditionField(
        event,
        eventConditions.find((cond) => event.format() == cond.eventSignature),
      ),
    ),
    functions: abiFunctions.map((func) =>
      toConditionField(
        func,
        functionConditions.find((cond) => func.format() == cond.functionSignature),
      ),
    ),
  };
}

export function getAbiInterface(abi: string | undefined): Interface | undefined {
  if (!abi) return;
  try {
    return parseAbi(abi);
  } catch (e) {
    return undefined;
  }
}

export const parseAbi = (abi: string): Interface => {
  try {
    return new Interface(abi);
  } catch (e) {
    throw new Error('Please enter a valid ABI');
  }
};

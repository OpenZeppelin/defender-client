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
import { err, ok, Result } from '../models/result';

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
    selected: false,
    signature: description.format(),
    inputs: description.inputs.map((i) => i.name).filter(Boolean),
    expression: '',
    error: '',
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
  const result = parseAbi(abi);
  if (result.isOk()) return result.value;
}
/**
 * Attempts to fix common "mistakes" when copy pasting an ABI.
 * For example, if a user copies a string literal set to a variable
 * in a script, quotes will be escaped with \, so we need to remove
 * wrapping quotes and replace \ with no-character.
 * As we learn from what users are putting here in production we could
 * make it smarter, at least for reasonable conversions like the one
 * we just described.
 * @param abi an ABI entered by the user into the UI
 */
export const sanitize = (abi: string): string => {
  let sanitizedAbi = abi.trim();

  if (sanitizedAbi.startsWith('"') && sanitizedAbi.endsWith('"')) {
    sanitizedAbi = sanitizedAbi.substr(1, sanitizedAbi.length - 2);
    sanitizedAbi = sanitizedAbi.replace(/\\"/g, '"');
    sanitizedAbi = sanitizedAbi.replace(/\\'/g, "'");
  }

  return sanitizedAbi;
};

export const parseAbi = (abi: string): Result<Interface, string> => {
  try {
    const sanitizedAbi = sanitize(abi);
    return ok(new Interface(sanitizedAbi));
  } catch (e) {
    return err('Please enter a valid ABI');
  }
};

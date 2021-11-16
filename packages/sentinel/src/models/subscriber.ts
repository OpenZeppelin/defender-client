export interface ExternalCreateSubscriberRequest {
  network: string;
  confirmLevel?: number;
  name: string;
  address: string;
  abi?: string;
  paused?: boolean;
  eventConditions?: EventCondition[];
  functionConditions?: FunctionCondition[];
  txCondition?: string;
  autotaskCondition?: string;
  autotaskTrigger?: string;
  alertThreshold?: Threshold;
  alertTimeoutMs?: number;
  notificationChannels: string[];
}
// Copied from openzeppelin/defender/models/src/types/subscribers.req.d.ts

import { Network } from './blockwatcher';
import { NotificationType } from './notification';

export interface BaseCreateSubscriberRequest {
  name: string;
  paused: boolean;
  alertThreshold?: Threshold;
  notifyConfig?: Notifications;
}

export interface BaseCreateSubscriberResponse extends BaseCreateSubscriberRequest {
  subscriberId: string;
  createdAt?: string;
}

export interface CreateFortaSubscriberRequest extends BaseCreateSubscriberRequest {
  fortaRule: FortaRule;
  type: 'FORTA';
  network?: Network;
}

export interface CreateBlockSubscriberRequest extends BaseCreateSubscriberRequest {
  addressRules: AddressRule[];
  blockWatcherId: string;
  network: Network;
  type: 'BLOCK';
}

export interface CreateFortaSubscriberResponse extends BaseCreateSubscriberResponse, CreateFortaSubscriberRequest {
  fortaLastProcessedTime?: string;
}

export interface CreateBlockSubscriberResponse extends BaseCreateSubscriberResponse, CreateBlockSubscriberRequest {}

export interface FortaRule {
  addresses?: Address[];
  agentIDs?: string[];
  conditions: FortaConditionSet;
  autotaskCondition?: AutotaskCondition;
}
export interface FortaConditionSet {
  alertIDs?: string[];
  minimumScannerCount: number;
  severity?: number;
}

export enum SubscriberType {
  BLOCK = 'BLOCK',
  FORTA = 'FORTA',
}

export const FortaAlertSeverity: { [key: string]: number } = {
  UNKNOWN: 0,
  INFO: 1,
  LOW: 2,
  MEDIUM: 3,
  HIGH: 4,
  CRITICAL: 5,
};

export interface FortaAlert {
  addresses: string[];
  severity: string;
  alert_id: string;
  scanner_count: number;
  name: string;
  description: string;
  hash: string;
  network: string;
  protocol: string;
  type: string;
  source: {
    tx_hash: string;
    agent: {
      id: string;
      name: string;
    };
  };
}

export type Address = string;
export interface AddressRule {
  conditions: ConditionSet[];
  autotaskCondition?: AutotaskCondition;
  address: Address;
  abi?: string;
}
export interface ConditionSet {
  eventConditions: EventCondition[];
  txConditions: TxCondition[];
  functionConditions: FunctionCondition[];
}
export interface EventCondition {
  eventSignature: string;
  expression?: string | null;
}
export interface TxCondition {
  status: 'success' | 'failed' | 'any';
  expression?: string | null;
}
export interface FunctionCondition {
  functionSignature: string;
  expression?: string | null;
}
export interface AutotaskCondition {
  autotaskId: string;
}
export interface Threshold {
  amount: number;
  windowSeconds: number;
}
export interface Notifications {
  notifications: NotificationReference[];
  autotaskId?: string;
  timeoutMs: number;
}
export interface NotificationReference {
  notificationId: string;
  type: NotificationType;
  [k: string]: unknown;
}

// Copied from ui/src/components/sentinel/types.ts

import { EventFragment, FunctionFragment } from '@ethersproject/abi';

export type Description = EventFragment | FunctionFragment;
export type Condition = EventCondition | FunctionCondition | undefined;

export interface Conditions {
  txExpression: string;
  events: ConditionField[];
  functions: ConditionField[];
}
export interface ConditionField {
  description: Description;
  signature: string;
  inputs: (string | undefined)[];
  expression: string;
  selected: boolean;
}

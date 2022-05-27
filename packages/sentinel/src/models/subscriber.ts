export type ExternalCreateSubscriberRequest =
  | ExternalCreateBlockSubscriberRequest
  | ExternalCreateFortaSubscriberRequest;

export type ExternalUpdateSubscriberRequest =
  | ExternalUpdateBlockSubscriberRequest
  | ExternalUpdateFortaSubscriberRequest;
export interface ExternalBaseCreateSubscriberRequest {
  name: string;
  addresses?: string[];
  abi?: string;
  paused?: boolean;
  alertThreshold?: Threshold;
  notifyConfig?: Notifications;
  autotaskCondition?: string;
  autotaskTrigger?: string;
  alertTimeoutMs?: number;
  notificationChannels: string[];
  type: 'FORTA' | 'BLOCK';
}
export interface ExternalCreateBlockSubscriberRequest extends ExternalBaseCreateSubscriberRequest {
  network: Network;
  confirmLevel?: number; // blockWatcherId
  addresses: string[];
  abi?: string;
  eventConditions?: EventCondition[];
  functionConditions?: FunctionCondition[];
  txCondition?: string;
  type: 'BLOCK';
}

export interface ExternalCreateFortaSubscriberRequest extends ExternalBaseCreateSubscriberRequest {
  network?: Network;
  fortaLastProcessedTime?: string;
  addresses?: Address[];
  agentIDs?: string[];
  fortaConditions: FortaConditionSet;
  type: 'FORTA';
}
export interface ExternalUpdateBlockSubscriberRequest
  extends Omit<ExternalCreateBlockSubscriberRequest, 'network' | 'addresses' | 'name' | 'notificationChannels'> {
  network?: Network;
  addresses?: string[];
  name?: string;
  notificationChannels?: string[];
}

export interface ExternalUpdateFortaSubscriberRequest
  extends Omit<ExternalCreateFortaSubscriberRequest, 'fortaConditions' | 'name' | 'notificationChannels'> {
  fortaConditions?: FortaConditionSet;
  name?: string;
  notificationChannels?: string[];
}

export type CreateSubscriberRequest = CreateBlockSubscriberRequest | CreateFortaSubscriberRequest;

// Copied from openzeppelin/defender/models/src/types/subscribers.req.d.ts

import { Network } from 'defender-base-client';
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

export interface PartialCreateFortaSubscriberRequest {
  fortaRule: FortaRule;
  network?: Network;
  type: 'FORTA';
}

export interface PartialCreateBlockSubscriberRequest {
  addressRules: AddressRule[];
  blockWatcherId: string;
  network: Network;
  type: 'BLOCK';
}

export interface CreateBlockSubscriberRequest
  extends BaseCreateSubscriberRequest,
    PartialCreateBlockSubscriberRequest {}

export interface CreateFortaSubscriberRequest
  extends BaseCreateSubscriberRequest,
    PartialCreateFortaSubscriberRequest {}

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

export type Address = string;
export interface AddressRule {
  conditions: ConditionSet[];
  autotaskCondition?: AutotaskCondition;
  addresses: Address[];
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
  messageBody?: string;
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

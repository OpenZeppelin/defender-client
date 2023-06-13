export type SentinelConfirmation = number | 'safe' | 'finalized';
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
  autotaskCondition?: string;
  autotaskTrigger?: string;
  alertTimeoutMs?: number;
  alertMessageBody?: string;
  alertMessageSubject?: string;
  notificationChannels: string[];
  notificationCategoryId?: string;
  type: 'FORTA' | 'BLOCK';
  riskCategory?: SubscriberRiskCategory;
  stackResourceId?: string;
}
export interface ExternalCreateBlockSubscriberRequest extends ExternalBaseCreateSubscriberRequest {
  network: Network;
  confirmLevel?: SentinelConfirmation; // blockWatcherId
  addresses: string[];
  abi?: string;
  eventConditions?: EventCondition[];
  functionConditions?: FunctionCondition[];
  txCondition?: string;
  type: 'BLOCK';
}

export interface ExternalCreateFortaSubscriberRequest extends ExternalBaseCreateSubscriberRequest {
  privateFortaNodeId?: string;
  network?: Network;
  fortaLastProcessedTime?: string;
  addresses?: Address[];
  // Forta have changed the terminology for 'Agent' to 'Detection Bot'
  // We will continue to refer to them as 'Agent' for now.
  // agentIDs should be a list of Bot IDs
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

import { Network } from '@openzeppelin/defender-base-client';
import { NotificationType } from './notification';

export interface BaseCreateSubscriberRequest {
  name: string;
  paused: boolean;
  alertThreshold?: Threshold;
  notifyConfig?: Notifications;
  riskCategory?: SubscriberRiskCategory;
  stackResourceId?: string;
}

export interface BaseCreateSubscriberResponse extends BaseCreateSubscriberRequest {
  subscriberId: string;
  createdAt?: string;
}

export interface PartialCreateFortaSubscriberRequest {
  privateFortaNodeId?: string;
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
  // Forta have changed the terminology for 'Agent' to 'Detection Bot'
  // We will continue to refer to them as 'Agent' for now.
  // agentIDs should be a list of Bot IDs
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

export type SubscriberRiskCategory =
  | 'NONE'
  | 'GOVERNANCE'
  | 'ACCESS-CONTROL'
  | 'SUSPICIOUS'
  | 'FINANCIAL'
  | 'TECHNICAL';

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
  notificationCategoryId?: string;
  autotaskId?: string;
  messageBody?: string;
  messageSubject?: string;
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

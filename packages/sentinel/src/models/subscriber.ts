import { NotificationType } from './notification';

type Modify<T, R> = Omit<T, keyof R> & R;

export type CreateSubscriberRequest = Modify<
  SaveSubscriberRequest,
  {
    blockWatcherId?: string;
    network: string;
  }
>;

// Copied from openzeppelin/defender/models/src/types/subscribers.req.d.ts
export type Address = string;
export interface SaveSubscriberRequest {
  blockWatcherId: string;
  name: string;
  paused: boolean;
  addressRules: AddressRule[];
  alertThreshold?: Threshold;
  notifyConfig?: Notifications;
}

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

import { CreateBlockSubscriberResponse } from './subscriber';

export interface DeletedSentinelResponse {
  message: string;
}

export type CreateSentinelResponse = CreateBlockSubscriberResponse;

export type ListSentinelResponse = {
  items: CreateSentinelResponse[];
  notificationsQuotaUsage: number;
  blockProcessedQuotaUsage: number;
  fortaAlertsQuotaUsage: number;
};

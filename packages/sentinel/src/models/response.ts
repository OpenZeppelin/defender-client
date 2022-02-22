import { 
  CreateBlockSubscriberResponse,
  CreateFortaSubscriberResponse
} from './subscriber';

export interface DeletedSentinelResponse {
  message: string;
}

export type CreateSentinelResponse = CreateBlockSubscriberResponse | CreateFortaSubscriberResponse;

export type ListSentinelResponse = {
  items: CreateSentinelResponse[];
  notificationsQuotaUsage: number;
  blockProcessedQuotaUsage: number;
  fortaAlertsQuotaUsage: number;
};

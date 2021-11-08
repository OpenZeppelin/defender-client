import { CreateBlockSubscriberResponse } from './subscriber';

export interface DeletedSentinelResponse {
  message: string;
}

export interface CreateSentinelResponse extends CreateBlockSubscriberResponse {}

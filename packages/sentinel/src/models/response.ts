import { Network } from 'defender-base-client';
import { SaveSubscriberRequest } from './subscriber';

export interface ExternalApiSentinelResponse extends SaveSubscriberRequest {
  subscriberId: string;
  createdAt?: string;
  network: Network;
}

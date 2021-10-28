import { BaseApiClient } from 'defender-base-client';
import { SaveSubscriberRequest as CreateSentinelRequest } from './models/subscriber';
import { ExternalApiSentinelResponse as SentinelResponse } from './models/response';
import { getSentinelUrl } from './utils';

export interface SentinelResponseWithUrl extends SentinelResponse {
  url: string;
}

export class SentinelClient extends BaseApiClient {
  protected getPoolId(): string {
    return process.env.DEFENDER_ADMIN_POOL_ID || 'us-west-2_94f3puJWv';
  }

  protected getPoolClientId(): string {
    return process.env.DEFENDER_ADMIN_POOL_CLIENT_ID || '40e58hbc7pktmnp9i26hh5nsav';
  }

  protected getApiUrl(): string {
    return process.env.DEFENDER_ADMIN_API_URL || 'https://defender-api.openzeppelin.com/sentinel/';
  }

  public async listSentinels(): Promise<SentinelResponse[]> {
    return this.apiCall(async (api) => {
      return (await api.get('/subscribers')) as SentinelResponse[];
    });
  }

  public async createSentinel(sentinel: CreateSentinelRequest): Promise<SentinelResponseWithUrl> {
    return this.apiCall(async (api) => {
      const response = (await api.post('/subscribers', sentinel)) as SentinelResponse;
      return { ...response, url: getSentinelUrl(response) };
    });
  }
}

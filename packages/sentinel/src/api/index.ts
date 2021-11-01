import { BaseApiClient } from 'defender-base-client';
import { SaveSubscriberRequest as CreateSentinelRequest } from '../models/subscriber';
import { ExternalApiSentinelResponse as SentinelResponse } from '../models/response';

export class SentinelClient extends BaseApiClient {
  protected getPoolId(): string {
    return process.env.DEFENDER_SENTINEL_POOL_ID || 'us-west-2_94f3puJWv';
  }

  protected getPoolClientId(): string {
    return process.env.DEFENDER_SENTINEL_POOL_CLIENT_ID || '40e58hbc7pktmnp9i26hh5nsav';
  }

  protected getApiUrl(): string {
    return process.env.DEFENDER_SENTINEL_API_URL || 'https://defender-api.openzeppelin.com/sentinel/';
  }

  public async list(): Promise<SentinelResponse[]> {
    return this.apiCall(async (api) => {
      return (await api.get('/subscribers')) as SentinelResponse[];
    });
  }

  public async create(sentinel: CreateSentinelRequest): Promise<SentinelResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.post('/subscribers', sentinel)) as SentinelResponse;
      return response;
    });
  }

  public async get(sentinelId: string): Promise<SentinelResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.get('/subscribers/' + sentinelId)) as SentinelResponse;
      return response;
    });
  }

  public async update(sentinelId: string, sentinel: CreateSentinelRequest): Promise<SentinelResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.put('/subscribers/' + sentinelId, sentinel)) as SentinelResponse;
      return response;
    });
  }

  public async delete(sentinelId: string): Promise<SentinelResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.delete('/subscribers/' + sentinelId)) as SentinelResponse;
      return response;
    });
  }

  public async pause(sentinelId: string): Promise<SentinelResponse> {
    return this.apiCall(async (api) => {
      const sentinel = (await api.get('/subscribers/' + sentinelId)) as CreateSentinelRequest;
      const response = (await api.put('/subscribers/' + sentinelId, { ...sentinel, paused: true })) as SentinelResponse;
      return response;
    });
  }

  public async unpause(sentinelId: string): Promise<SentinelResponse> {
    return this.apiCall(async (api) => {
      const sentinel = (await api.get('/subscribers/' + sentinelId)) as CreateSentinelRequest;
      const response = (await api.put('/subscribers/' + sentinelId, {
        ...sentinel,
        paused: false,
      })) as SentinelResponse;
      return response;
    });
  }
}

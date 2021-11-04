import { BaseApiClient } from 'defender-base-client';
import { CreateSubscriberRequest as CreateSentinelRequest } from '../models/subscriber';
import { DeletedSentinelResponse, ExternalApiSentinelResponse as SentinelResponse } from '../models/response';
import {
  NotificationSummary as NotificationResponse,
  NotificationType,
  SaveNotificationRequest as NotificationRequest,
} from '../models/notification';
import { BlockWatcher } from '../models/blockwatcher';

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
    const blockWatcherId = await this.getBlockwatcherIdByNetwork(sentinel.network);
    return this.apiCall(async (api) => {
      const response = (await api.post('/subscribers', { ...sentinel, blockWatcherId })) as SentinelResponse;
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
    const currentSentinel = (await this.get(sentinelId)) as CreateSentinelRequest;
    const blockWatcherId = await this.getBlockwatcherIdByNetwork(sentinel.network);
    return this.apiCall(async (api) => {
      const response = (await api.put('/subscribers/' + sentinelId, {
        ...currentSentinel,
        ...sentinel,
        blockWatcherId,
      })) as SentinelResponse;
      return response;
    });
  }

  public async delete(sentinelId: string): Promise<DeletedSentinelResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.delete('/subscribers/' + sentinelId)) as DeletedSentinelResponse;
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

  public async createNotificationChannel(
    type: NotificationType,
    notification: NotificationRequest,
  ): Promise<NotificationResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.post('/notifications/' + type, notification)) as NotificationResponse;
      return response;
    });
  }

  public async listNotificationChannels(): Promise<NotificationResponse[]> {
    return this.apiCall(async (api) => {
      const response = (await api.get('/notifications')) as NotificationResponse[];
      return response;
    });
  }

  private async listBlockwatchers(): Promise<BlockWatcher[]> {
    return this.apiCall(async (api) => {
      const response = (await api.get('/blockwatchers')) as BlockWatcher[];
      return response;
    });
  }

  private async getBlockwatcherIdByNetwork(network: string): Promise<string | undefined> {
    return (await this.listBlockwatchers()).find((blockwatcher) => blockwatcher.network === network)?.blockWatcherId;
  }
}

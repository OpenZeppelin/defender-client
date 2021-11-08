import { BaseApiClient } from 'defender-base-client';
import { CreateBlockSubscriberRequest as CreateSentinelRequest } from '../models/subscriber';
import { DeletedSentinelResponse, CreateSentinelResponse } from '../models/response';
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

  public async list(): Promise<CreateSentinelResponse[]> {
    return this.apiCall(async (api) => {
      return (await api.get('/subscribers')) as CreateSentinelResponse[];
    });
  }

  public async create(sentinel: CreateSentinelRequest): Promise<CreateSentinelResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.post('/subscribers', sentinel)) as CreateSentinelResponse;
      return response;
    });
  }

  public async get(sentinelId: string): Promise<CreateSentinelResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.get('/subscribers/' + sentinelId)) as CreateSentinelResponse;
      return response;
    });
  }

  public async update(sentinelId: string, sentinel: CreateSentinelRequest): Promise<CreateSentinelResponse> {
    const currentSentinel = (await this.get(sentinelId)) as CreateSentinelRequest;
    return this.apiCall(async (api) => {
      const response = (await api.put('/subscribers/' + sentinelId, {
        ...currentSentinel,
        ...sentinel,
      })) as CreateSentinelResponse;
      return response;
    });
  }

  public async delete(sentinelId: string): Promise<DeletedSentinelResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.delete('/subscribers/' + sentinelId)) as DeletedSentinelResponse;
      return response;
    });
  }

  public async pause(sentinelId: string): Promise<CreateSentinelRequest> {
    return this.apiCall(async (api) => {
      const sentinel = (await api.get('/subscribers/' + sentinelId)) as CreateSentinelRequest;
      const response = (await api.put('/subscribers/' + sentinelId, {
        ...sentinel,
        paused: true,
      })) as CreateSentinelRequest;
      return response;
    });
  }

  public async unpause(sentinelId: string): Promise<CreateSentinelRequest> {
    return this.apiCall(async (api) => {
      const sentinel = (await api.get('/subscribers/' + sentinelId)) as CreateSentinelRequest;
      const response = (await api.put('/subscribers/' + sentinelId, {
        ...sentinel,
        paused: false,
      })) as CreateSentinelRequest;
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

  public async listBlockwatchers(): Promise<BlockWatcher[]> {
    return this.apiCall(async (api) => {
      const response = (await api.get('/blockwatchers')) as BlockWatcher[];
      return response;
    });
  }

  public async getBlockwatcherIdByNetwork(network: string): Promise<BlockWatcher[]> {
    return (await this.listBlockwatchers()).filter((blockwatcher) => blockwatcher.network === network);
  }
}

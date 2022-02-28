import { BaseApiClient } from 'defender-base-client';
import {
  ConditionSet,
  CreateBlockSubscriberRequest,
  ExternalCreateSubscriberRequest as CreateSentinelRequest,
  NotificationReference,
} from '../models/subscriber';
import { DeletedSentinelResponse, CreateSentinelResponse, ListSentinelResponse } from '../models/response';
import {
  NotificationSummary as NotificationResponse,
  NotificationType,
  SaveNotificationRequest as NotificationRequest,
} from '../models/notification';
import { BlockWatcher, Network } from '../models/blockwatcher';

import _ from 'lodash';
import getConditionSets, { getSentinelConditions } from '../utils';

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

  public async list(): Promise<ListSentinelResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/subscribers`);
    });
  }

  public async create(sentinel: CreateSentinelRequest): Promise<CreateSentinelResponse> {
    const newSentinel = await this.constructSentinelRequest(sentinel);
    return this.apiCall(async (api) => {
      return await api.post(`/subscribers`, newSentinel);
    });
  }

  public async get(sentinelId: string): Promise<CreateSentinelResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/subscribers/${sentinelId}`);
    });
  }

  public async update(sentinelId: string, sentinel: CreateSentinelRequest): Promise<CreateSentinelResponse> {
    const currentSentinel = (await this.get(sentinelId)) as CreateBlockSubscriberRequest;
    const newSentinel = await this.constructSentinelRequest(sentinel);
    return this.apiCall(async (api) => {
      return await api.put(`/subscribers/${sentinelId}`, {
        ...currentSentinel,
        ...newSentinel,
      });
    });
  }

  public async delete(sentinelId: string): Promise<DeletedSentinelResponse> {
    return this.apiCall(async (api) => {
      return await api.delete(`/subscribers/${sentinelId}`);
    });
  }

  public async pause(sentinelId: string): Promise<CreateSentinelRequest> {
    return this.apiCall(async (api) => {
      const sentinel = (await api.get(`/subscribers/${sentinelId}`)) as CreateSentinelRequest;
      return await api.put(`/subscribers/${sentinelId}`, {
        ...sentinel,
        paused: true,
      });
    });
  }

  public async unpause(sentinelId: string): Promise<CreateSentinelRequest> {
    return this.apiCall(async (api) => {
      const sentinel = (await api.get(`/subscribers/${sentinelId}`)) as CreateSentinelRequest;
      return await api.put(`/subscribers/${sentinelId}`, {
        ...sentinel,
        paused: false,
      });
    });
  }

  public async createNotificationChannel(
    type: NotificationType,
    notification: NotificationRequest,
  ): Promise<NotificationResponse> {
    return this.apiCall(async (api) => {
      return await api.post(`/notifications/${type}`, notification);
    });
  }

  public async listNotificationChannels(): Promise<NotificationResponse[]> {
    return this.apiCall(async (api) => {
      return await api.get(`/notifications`);
    });
  }

  public async listBlockwatchers(): Promise<BlockWatcher[]> {
    return this.apiCall(async (api) => {
      return await api.get(`/blockwatchers`);
    });
  }

  public async getBlockwatcherIdByNetwork(network: string): Promise<BlockWatcher[]> {
    return (await this.listBlockwatchers()).filter((blockwatcher) => blockwatcher.network === network);
  }

  private async constructSentinelRequest(sentinel: CreateSentinelRequest): Promise<CreateBlockSubscriberRequest> {
    const blockWatchers = await this.getBlockwatcherIdByNetwork(sentinel.network);
    let blockWatcherId =
      blockWatchers.length > 0 ? _.sortBy(blockWatchers, ['confirmLevel']).reverse()[0].blockWatcherId : undefined;

    if (sentinel.confirmLevel) {
      blockWatcherId = blockWatchers.find((watcher) => watcher.confirmLevel === sentinel.confirmLevel)?.blockWatcherId;
    }

    if (!blockWatcherId) {
      throw new Error(`Provided network and confirmLevel do not match a block watcher.`);
    }

    const notifications: NotificationReference[] = [];
    const notificationChannels = await this.listNotificationChannels();

    notificationChannels.map((channel) => {
      if (sentinel.notificationChannels.includes(channel.notificationId)) {
        notifications.push(channel);
      }
    });

    const newConditions: ConditionSet[] = [];

    if (sentinel.eventConditions) {
      sentinel.eventConditions.map((condition) => {
        newConditions.push({
          eventConditions: [condition],
          txConditions: sentinel.txCondition ? [{ status: 'any', expression: sentinel.txCondition }] : [],
          functionConditions: [],
        });
      });
    }

    if (sentinel.functionConditions) {
      sentinel.functionConditions.map((condition) => {
        newConditions.push({
          eventConditions: [],
          txConditions: sentinel.txCondition ? [{ status: 'any', expression: sentinel.txCondition }] : [],
          functionConditions: [condition],
        });
      });
    }

    const conditions = getSentinelConditions([
      {
        conditions: newConditions,
        abi: sentinel.abi,
        addresses: sentinel.addresses,
      },
    ]);

    return {
      blockWatcherId,
      name: sentinel.name,
      alertThreshold: sentinel.alertThreshold,
      notifyConfig: {
        notifications,
        autotaskId: sentinel.autotaskTrigger ?? undefined,
        timeoutMs: sentinel.alertTimeoutMs ?? 0,
      },
      paused: sentinel.paused ? sentinel.paused : false,
      addressRules: [
        {
          conditions: getConditionSets(conditions.txExpression, conditions.events, conditions.functions),
          autotaskCondition: sentinel.autotaskCondition ? { autotaskId: sentinel.autotaskCondition } : undefined,
          addresses: sentinel.addresses,
          abi: sentinel.abi,
        },
      ],
      network: sentinel.network as Network,
      type: 'BLOCK',
    };
  }
}

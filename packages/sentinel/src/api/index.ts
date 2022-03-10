import { BaseApiClient } from 'defender-base-client';
import {
  ConditionSet,
  CreateSubscriberRequest,
  ExternalCreateBlockSubscriberRequest as CreateBlockSentinelRequest,
  ExternalCreateFortaSubscriberRequest as CreateFortaSentinelRequest,
  ExternalCreateSubscriberRequest as CreateSentinelRequest,
  ExternalUpdateSubscriberRequest as UpdateSentinelRequest,
  NotificationReference,
  PartialCreateBlockSubscriberRequest,
  PartialCreateFortaSubscriberRequest,
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

  public async update(sentinelId: string, sentinel: UpdateSentinelRequest): Promise<CreateSentinelResponse> {
    const currentSentinel = await this.get(sentinelId);
    return this.apiCall(async (api) => {
      return await api.put(`/subscribers/${sentinelId}`, {
        ...currentSentinel,
        ...sentinel,
      });
    });
  }

  public async delete(sentinelId: string): Promise<DeletedSentinelResponse> {
    return this.apiCall(async (api) => {
      return await api.delete(`/subscribers/${sentinelId}`);
    });
  }

  public async pause(sentinelId: string): Promise<CreateSentinelRequest> {
    const sentinel = await this.get(`/subscribers/${sentinelId}`);
    return this.apiCall(async (api) => {
      return await api.put(`/subscribers/${sentinelId}`, {
        ...sentinel,
        paused: true,
      });
    });
  }

  public async unpause(sentinelId: string): Promise<CreateSentinelRequest> {
    const sentinel = await this.get(`/subscribers/${sentinelId}`);
    return this.apiCall(async (api) => {
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

  private constructFortaSentinel(sentinel: CreateFortaSentinelRequest): PartialCreateFortaSubscriberRequest {
    return {
      fortaRule: {
        addresses: sentinel.addresses,
        agentIDs: sentinel.agentIDs,
        conditions: sentinel.fortaConditions,
        autotaskCondition: sentinel.autotaskCondition ? { autotaskId: sentinel.autotaskCondition } : undefined,
      },
      type: 'FORTA',
    };
  }

  private async constructBlockSentinel(
    sentinel: CreateBlockSentinelRequest,
  ): Promise<PartialCreateBlockSubscriberRequest> {
    const blockWatchers = await this.getBlockwatcherIdByNetwork(sentinel.network);
    let blockWatcherId =
      blockWatchers.length > 0 ? _.sortBy(blockWatchers, ['confirmLevel']).reverse()[0].blockWatcherId : undefined;

    if (sentinel.confirmLevel) {
      blockWatcherId = blockWatchers.find((watcher) => watcher.confirmLevel === sentinel.confirmLevel)?.blockWatcherId;
    }

    if (!blockWatcherId) {
      throw new Error(`Provided network and confirmLevel do not match a block watcher.`);
    }

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

  private async getNotifications(sentinelChannels: string[]): Promise<NotificationReference[]> {
    const notifications: NotificationReference[] = [];
    const notificationChannels = await this.listNotificationChannels();

    notificationChannels.map((channel) => {
      if (sentinelChannels.includes(channel.notificationId)) {
        notifications.push(channel);
      }
    });

    return notifications;
  }

  private async constructSentinelRequest(sentinel: CreateSentinelRequest): Promise<CreateSubscriberRequest> {
    let partialResponse: PartialCreateBlockSubscriberRequest | PartialCreateFortaSubscriberRequest;

    if (sentinel.type === 'BLOCK') {
      partialResponse = await this.constructBlockSentinel(sentinel);
    } else if (sentinel.type === 'FORTA') {
      partialResponse = this.constructFortaSentinel(sentinel);
    } else {
      throw new Error(`Invalid sentinel type. Type must be FORTA or BLOCK`);
    }

    return {
      ...partialResponse,
      name: sentinel.name,
      alertThreshold: sentinel.alertThreshold,
      notifyConfig: {
        notifications: await this.getNotifications(sentinel.notificationChannels),
        autotaskId: sentinel.autotaskTrigger ?? undefined,
        timeoutMs: sentinel.alertTimeoutMs ?? 0,
      },
      paused: sentinel.paused ? sentinel.paused : false,
    };
  }
}

import { BaseApiClient, Network, ApiVersion } from '@openzeppelin/defender-base-client';
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
  CreateFortaSubscriberResponse,
  CreateBlockSubscriberResponse,
} from '../models/subscriber';
import { DeletedSentinelResponse, CreateSentinelResponse, ListSentinelResponse } from '../models/response';
import {
  CreateNotificationRequest,
  DeleteNotificationRequest,
  GetNotificationRequest,
  NotificationSummary as NotificationResponse,
  UpdateNotificationRequest,
} from '../models/notification';
import { BlockWatcher } from '../models/blockwatcher';

import _ from 'lodash';
import getConditionSets, { getSentinelConditions } from '../utils';
import {
  NotificationCategory as NotificationCategoryResponse,
  UpdateNotificationCategoryRequest,
} from '../models/category';
import { ListNetworkRequestOptions } from '../models/networks';

export class SentinelClient extends BaseApiClient {
  protected getPoolId(): string {
    return process.env.DEFENDER_SENTINEL_POOL_ID || 'us-west-2_94f3puJWv';
  }

  protected getPoolClientId(): string {
    return process.env.DEFENDER_SENTINEL_POOL_CLIENT_ID || '40e58hbc7pktmnp9i26hh5nsav';
  }

  protected getApiUrl(v: ApiVersion = 'v1'): string {
    if (v === 'v2') {
      return process.env.DEFENDER_API_V2_URL || 'https://defender-api.openzeppelin.com/v2/';
    }
    return process.env.DEFENDER_SENTINEL_API_URL || 'https://defender-api.openzeppelin.com/sentinel/';
  }

  public async listNetworks(opts?: ListNetworkRequestOptions): Promise<Network[]> {
    return this.apiCall(async (api) => {
      return await api.get(opts && opts.networkType ? `/networks?type=${opts.networkType}` : `/networks`);
    });
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
      return await api.put(
        `/subscribers/${sentinelId}`,
        await this.mergeApiSentinelWithUpdateSentinel(currentSentinel, sentinel),
      );
    });
  }

  public async delete(sentinelId: string): Promise<DeletedSentinelResponse> {
    return this.apiCall(async (api) => {
      return await api.delete(`/subscribers/${sentinelId}`);
    });
  }

  public async pause(sentinelId: string): Promise<CreateSentinelRequest> {
    const sentinel = await this.get(sentinelId);
    return this.apiCall(async (api) => {
      return await api.put(
        `/subscribers/${sentinelId}`,
        await this.mergeApiSentinelWithUpdateSentinel(sentinel, { type: sentinel.type, paused: true }),
      );
    });
  }

  public async unpause(sentinelId: string): Promise<CreateSentinelRequest> {
    const sentinel = await this.get(sentinelId);
    return this.apiCall(async (api) => {
      return await api.put(
        `/subscribers/${sentinelId}`,
        await this.mergeApiSentinelWithUpdateSentinel(sentinel, { type: sentinel.type, paused: false }),
      );
    });
  }

  public async createNotificationChannel(notification: CreateNotificationRequest): Promise<NotificationResponse> {
    return this.apiCall(async (api) => {
      return await api.post(`/notifications/${notification.type}`, notification);
    });
  }

  public async listNotificationChannels(): Promise<NotificationResponse[]> {
    return this.apiCall(async (api) => {
      return await api.get(`/notifications`);
    });
  }

  public async deleteNotificationChannel(notification: DeleteNotificationRequest): Promise<string> {
    return this.apiCall(async (api) => {
      return await api.delete(`/notifications/${notification.type}/${notification.notificationId}`);
    });
  }

  public async getNotificationChannel(notification: GetNotificationRequest): Promise<NotificationResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/notifications/${notification.type}/${notification.notificationId}`);
    });
  }

  public async updateNotificationChannel(notification: UpdateNotificationRequest): Promise<NotificationResponse> {
    return this.apiCall(async (api) => {
      return await api.put(`/notifications/${notification.type}/${notification.notificationId}`, notification);
    });
  }

  public async listNotificationCategories(): Promise<NotificationCategoryResponse[]> {
    return this.apiCall(async (api) => {
      return await api.get(`/notifications/categories`);
    });
  }

  public async getNotificationCategory(categoryId: string): Promise<NotificationCategoryResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/notifications/categories/${categoryId}`);
    });
  }

  public async updateNotificationCategory(
    category: UpdateNotificationCategoryRequest,
  ): Promise<NotificationCategoryResponse> {
    return this.apiCall(async (api) => {
      return await api.put(`/notifications/categories/${category.categoryId}`, category);
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
      privateFortaNodeId: sentinel.privateFortaNodeId,
      network: sentinel.network,
      type: 'FORTA',
    };
  }

  private normaliseABI(abi: any): string | undefined {
    return abi ? (typeof abi === 'string' ? abi : JSON.stringify(abi)) : undefined;
  }

  private async constructBlockSentinel(
    sentinel: CreateBlockSentinelRequest,
  ): Promise<PartialCreateBlockSubscriberRequest> {
    const blockWatchers = await this.getBlockwatcherIdByNetwork(sentinel.network);

    let blockWatcherId;

    if (blockWatchers?.length > 0) {
      const blockWatchersSorted = _.sortBy(
        blockWatchers.filter(({ confirmLevel }) => _.isNumber(confirmLevel)), // Only consider numberish confirmLevels
        ['confirmLevel'],
      ).reverse();
      blockWatcherId = blockWatchersSorted[0]?.blockWatcherId;
    }

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
          txConditions: [],
          functionConditions: [],
        });
      });
    }

    if (sentinel.functionConditions) {
      sentinel.functionConditions.map((condition) => {
        newConditions.push({
          eventConditions: [],
          txConditions: [],
          functionConditions: [condition],
        });
      });
    }

    if (sentinel.txCondition) {
      newConditions.push({
        eventConditions: [],
        txConditions: [{ status: 'any', expression: sentinel.txCondition }],
        functionConditions: [],
      });
    }

    const conditions = getSentinelConditions([
      {
        conditions: newConditions,
        abi: this.normaliseABI(sentinel.abi),
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
          abi: this.normaliseABI(sentinel.abi),
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

    const notificationChannels = await this.getNotifications(sentinel.notificationChannels);

    return {
      ...partialResponse,
      name: sentinel.name,
      alertThreshold: sentinel.alertThreshold,
      notifyConfig: {
        notifications: notificationChannels,
        notificationCategoryId: _.isEmpty(notificationChannels) ? sentinel.notificationCategoryId : undefined,
        autotaskId: sentinel.autotaskTrigger ? sentinel.autotaskTrigger : undefined,
        timeoutMs: sentinel.alertTimeoutMs ? sentinel.alertTimeoutMs : 0,
        messageBody: sentinel.alertMessageBody ? sentinel.alertMessageBody : undefined,
        messageSubject: sentinel.alertMessageSubject ? sentinel.alertMessageSubject : undefined,
      },
      paused: sentinel.paused ? sentinel.paused : false,
      riskCategory: sentinel.riskCategory,
      stackResourceId: sentinel.stackResourceId,
    };
  }

  private toCreateBlockSentinelRequest(sentinel: CreateBlockSubscriberResponse): CreateBlockSentinelRequest {
    const rule = sentinel.addressRules[0];
    let txCondition;

    if (!rule) throw new Error(`No rule found for monitor ${sentinel.name}`);

    for (const condition of rule.conditions) {
      for (const cond of condition.txConditions) {
        if (cond.expression) txCondition = cond.expression;
      }
    }

    return {
      type: 'BLOCK',
      addresses: rule.addresses, // There's only one addressRules at the moment, may cause problems if we add multiple address rules
      abi: this.normaliseABI(rule.abi),
      eventConditions: _.flatten(rule.conditions.map((condition) => condition.eventConditions)),
      functionConditions: _.flatten(rule.conditions.map((condition) => condition.functionConditions)),
      txCondition,
      name: sentinel.name,
      paused: sentinel.paused,
      alertThreshold: sentinel.alertThreshold,
      autotaskCondition: rule.autotaskCondition?.autotaskId,
      autotaskTrigger: sentinel.notifyConfig?.autotaskId,
      alertTimeoutMs: sentinel.notifyConfig?.timeoutMs,
      alertMessageSubject: sentinel.notifyConfig?.messageSubject,
      alertMessageBody: sentinel.notifyConfig?.messageBody,
      notificationChannels: sentinel.notifyConfig?.notifications?.map(({ notificationId }) => notificationId) ?? [],
      notificationCategoryId: sentinel.notifyConfig?.notificationCategoryId,
      network: sentinel.network,
      confirmLevel: parseInt(_.last(sentinel.blockWatcherId.split('-')) as string), // We're sure there is always a last number if the convention is followd
    };
  }

  private toCreateFortaSentinelRequest(sentinel: CreateFortaSubscriberResponse): CreateFortaSentinelRequest {
    return {
      type: 'FORTA',
      name: sentinel.name,
      paused: sentinel.paused,
      alertThreshold: sentinel.alertThreshold,
      autotaskCondition: sentinel.fortaRule.autotaskCondition?.autotaskId,
      autotaskTrigger: sentinel.notifyConfig?.autotaskId,
      alertTimeoutMs: sentinel.notifyConfig?.timeoutMs,
      alertMessageSubject: sentinel.notifyConfig?.messageSubject,
      alertMessageBody: sentinel.notifyConfig?.messageBody,
      notificationChannels: sentinel.notifyConfig?.notifications?.map(({ notificationId }) => notificationId) ?? [],
      notificationCategoryId: sentinel.notifyConfig?.notificationCategoryId,
      network: sentinel.network,
      fortaLastProcessedTime: sentinel.fortaLastProcessedTime,
      addresses: sentinel.fortaRule.addresses,
      agentIDs: sentinel.fortaRule.agentIDs,
      fortaConditions: sentinel.fortaRule.conditions,
      privateFortaNodeId: sentinel.privateFortaNodeId,
    };
  }

  private toCreateSentinelRequest(sentinel: CreateSentinelResponse): CreateSentinelRequest {
    if (sentinel.type === 'BLOCK') return this.toCreateBlockSentinelRequest(sentinel);
    if (sentinel.type === 'FORTA') return this.toCreateFortaSentinelRequest(sentinel);

    throw new Error(`Invalid sentinel type. Type must be FORTA or BLOCK`);
  }

  private mergeApiSentinelWithUpdateSentinel(
    apiSentinel: CreateSentinelResponse,
    sentinel: UpdateSentinelRequest,
  ): Promise<CreateSubscriberRequest> {
    const newSentinel: CreateSentinelRequest = this.toCreateSentinelRequest(apiSentinel);

    const updatedProperties = Object.keys(sentinel) as Array<keyof typeof sentinel>;
    for (const prop of updatedProperties) {
      (newSentinel[prop] as any) = sentinel[prop];
    }

    return this.constructSentinelRequest(newSentinel);
  }
}

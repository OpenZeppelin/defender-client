// Copied from openzeppelin/defender/models/src/types/notification-*.req.d.ts

import { PagerDutyConfig } from './pager-duty';
import { OpsgenieConfig } from './opsgenie';

export type SaveNotificationRequest =
  | SaveNotificationSlackRequest
  | SaveNotificationEmailRequest
  | SaveNotificationDiscordRequest
  | SaveNotificationTelegramBotRequest
  | SaveNotificationPagerDutyRequest
  | SaveNotificationDatadogRequest
  | SaveNotificationOpsgenieRequest;

export type NotificationType =
  | 'slack'
  | 'email'
  | 'discord'
  | 'telegram'
  | 'datadog'
  | 'webhook'
  | 'opsgenie'
  | 'pager-duty';

export type BaseNotificationRequest = {
  name: string;
  paused: boolean;
  stackResourceId?: string;
};

export interface SaveNotificationOpsgenieRequest extends BaseNotificationRequest {
  config: OpsgenieConfig;
}

export interface SaveNotificationSlackRequest extends BaseNotificationRequest {
  config: SlackConfig;
}

export interface SaveNotificationPagerDutyRequest extends BaseNotificationRequest {
  config: PagerDutyConfig;
}
export interface SlackConfig {
  url: string;
}

export interface SaveNotificationTelegramBotRequest extends BaseNotificationRequest {
  config: TelegramBotConfig;
}
export interface TelegramBotConfig {
  botToken: string;
  chatId: string;
}

export interface SaveNotificationEmailRequest extends BaseNotificationRequest {
  config: EmailConfig;
}
export interface EmailConfig {
  emails: string[];
}

export interface SaveNotificationDiscordRequest extends BaseNotificationRequest {
  config: DiscordConfig;
}
export interface DiscordConfig {
  url: string;
}

export interface NotificationSummary extends BaseNotificationRequest {
  notificationId: string;
  type: NotificationType;
  [k: string]: unknown;
}

export interface SaveNotificationDatadogRequest extends BaseNotificationRequest {
  config: DatadogConfig;
}
export interface DatadogConfig {
  apiKey: string;
  metricPrefix: string;
}

export interface NotificationRequest {
  type: NotificationType;
  notificationId: string;
}

export type DeleteNotificationRequest = NotificationRequest;
export type UpdateNotificationRequest = NotificationRequest & SaveNotificationRequest;
export type GetNotificationRequest = NotificationRequest & Omit<BaseNotificationRequest, 'name' | 'paused'>;
export type CreateNotificationRequest = Omit<NotificationRequest, 'notificationId'> & SaveNotificationRequest;

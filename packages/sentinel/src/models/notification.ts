// Copied from openzeppelin/defender/models/src/types/notification-*.req.d.ts

export type SaveNotificationRequest =
  | SaveNotificationSlackRequest
  | SaveNotificationEmailRequest
  | SaveNotificationDiscordRequest
  | SaveNotificationTelegramBotRequest
  | SaveNotificationDatadogRequest;

export type NotificationType = 'slack' | 'email' | 'discord' | 'telegram' | 'datadog';

export interface SaveNotificationSlackRequest {
  name: string;
  config: SlackConfig;
  paused: boolean;
}
export interface SlackConfig {
  url: string;
}

export interface SaveNotificationTelegramBotRequest {
  name: string;
  config: TelegramBotConfig;
  paused: boolean;
}
export interface TelegramBotConfig {
  botToken: string;
  chatId: string;
}

export interface SaveNotificationEmailRequest {
  name: string;
  config: EmailConfig;
  paused: boolean;
}
export interface EmailConfig {
  emails: string[];
}

export interface SaveNotificationDiscordRequest {
  name: string;
  config: DiscordConfig;
  paused: boolean;
}
export interface DiscordConfig {
  url: string;
}

export interface NotificationSummary {
  notificationId: string;
  name: string;
  type: NotificationType;
  paused: boolean;
  [k: string]: unknown;
}

export interface SaveNotificationDatadogRequest {
  name: string;
  config: DatadogConfig;
  paused: boolean;
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
export type GetNotificationRequest = NotificationRequest;
export type CreateNotificationRequest = Omit<NotificationRequest, 'notificationId'> & SaveNotificationRequest;

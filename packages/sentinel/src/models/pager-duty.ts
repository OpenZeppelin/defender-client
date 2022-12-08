export type PagerDutyEventType = 'change' | 'alert';
export type PagerDutyEventAction = 'trigger' | 'acknowledge' | 'resolve';
export type PagerDutySeverity = 'critical' | 'error' | 'warning' | 'info';

export interface SaveNotificationPagerDutyRequest {
  name: string;
  config: PagerDutyConfig;
  paused: boolean;
  pausedUntil?: string;
  stackResourceId?: string;
}

export interface PagerDutyConfig {
  token: string;
  eventType: PagerDutyEventType;
  routingKey: string;
  eventAction?: PagerDutyEventAction;
  dedupKey?: string;
  severity?: PagerDutySeverity;
  component?: string;
  group?: string;
  class?: string;
  customDetails?: {
    [k: string]: string;
  };
}

export interface CreateAutotaskRequest {
  name: string;
  encodedZippedCode: string;
  relayerId?: string;
  trigger: {
    type: 'schedule' | 'webhook';
    frequencyMinutes?: number;
    cron?: string;
  };
  paused: boolean;
}

export interface ScheduleTrigger {
  type: 'schedule';
  frequencyMinutes?: number;
  cron?: string;
}

export interface WebhookTrigger {
  type: 'webhook';
  token: string;
}

export interface Autotask extends Pick<CreateAutotaskRequest, 'name' | 'relayerId' | 'paused'> {
  autotaskId: string;
  encodedZippedCode?: string;
  trigger: ScheduleTrigger | WebhookTrigger;
  createdAt?: string;
}

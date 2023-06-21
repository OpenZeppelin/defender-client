export interface CreateAutotaskRequest {
  name: string;
  encodedZippedCode: string;
  relayerId?: string;
  trigger: {
    type: 'schedule' | 'webhook' | 'sentinel' | 'monitor-filter' | 'scenario';
    frequencyMinutes?: number;
    cron?: string;
  };
  paused: boolean;
  stackResourceId?: string;
  dependenciesVersion?: string;
}

export interface UpdateAutotaskRequest extends Omit<CreateAutotaskRequest, 'encodedZippedCode'> {
  autotaskId: string;
  encodedZippedCode?: string;
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

export interface SentinelTrigger {
  type: 'sentinel';
}

export interface MonitorFilterTrigger {
  type: 'monitor-filter';
}

export type ScenarioTrigger = {
  type: 'scenario';
};

export interface Autotask
  extends Pick<CreateAutotaskRequest, 'name' | 'relayerId' | 'paused' | 'stackResourceId' | 'dependenciesVersion'> {
  autotaskId: string;
  encodedZippedCode?: string;
  trigger: ScheduleTrigger | WebhookTrigger | SentinelTrigger | MonitorFilterTrigger | ScenarioTrigger;
  createdAt?: string;
  codeDigest?: string;
}

export interface SaveSecretsRequest {
  deletes: string[];
  secrets: SecretsMap;
}
export interface SecretsMap {
  [k: string]: string;
}

export interface GetSecretsResponse {
  secretNames?: string[];
}

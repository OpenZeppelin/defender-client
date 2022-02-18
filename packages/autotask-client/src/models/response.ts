export interface AutotaskScheduleTriggerResponse {
  cron?: string;
  frequencyMinutes?: number;
  token: string;
  type: string;
}

export interface AutotaskWebhookTriggerResponse {
  token: string;
  type: string;
}

export interface CreateAutotaskResponse {
  autotaskId: string;
  name: string;
  paused: boolean;
  trigger: AutotaskScheduleTriggerResponse | AutotaskWebhookTriggerResponse;
  encodedZippedCode: string;
};

export type UpdateAutotaskConfigResponse = CreateAutotaskResponse;

export interface ListAutotaskResponse {
  items: CreateAutotaskResponse[];
};

export interface AutotaskTriggerConfig {
  cron?: string;
  type: string;
}

export interface CreateAutotaskRequest {
  name: string;
  paused: boolean;
  trigger: AutotaskTriggerConfig;
  encodedZippedCode: string;
}

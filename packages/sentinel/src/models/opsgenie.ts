export type OpsgenieInstanceLocation = 'US' | 'EU';
export type OpsgenieUserType = 'team' | 'user' | 'escalation' | 'schedule';
export type OpsgeniePriorityLevel = 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export interface SaveNotificationOpsgenieRequest {
  name: string;
  config: OpsgenieConfig;
  paused: boolean;
  pausedUntil?: string;
  stackResourceId?: string;
}

export interface OpsgenieConfig {
  apiKey: string;
  instanceLocation: OpsgenieInstanceLocation;
  alias?: string;
  responders?: OpsgenieUser[];
  visibleTo?: OpsgenieUser[];
  /**
   * @maxItems 10
   */
  actions?:
    | []
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string];
  /**
   * @maxItems 10
   */
  tags?:
    | []
    | [string]
    | [string, string]
    | [string, string, string]
    | [string, string, string, string]
    | [string, string, string, string, string]
    | [string, string, string, string, string, string]
    | [string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string]
    | [string, string, string, string, string, string, string, string, string, string];
  details?: {
    [k: string]: string;
  };
  entity?: string;
  priority?: OpsgeniePriorityLevel;
  note?: string;
}

export interface OpsgenieUser {
  username: string;
  fullName?: string;
  id?: string;
  type: OpsgenieUserType;
}

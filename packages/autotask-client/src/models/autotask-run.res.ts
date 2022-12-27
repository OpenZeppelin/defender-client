import { Autotask } from './autotask';

export type AutotaskRunTrigger = Autotask['trigger']['type'] | 'sentinel' | 'manual' | 'manual-api';
export type AutotaskRunStatus = AutotaskRunResponse['status'];

export type AutotaskErrorType = 'TIMEOUT' | 'INSUFFICIENT_FUNDS' | 'RELAYER_CONFIGURATION' | 'INTERNAL' | 'PROGRAM';

export interface AutotaskRunBase {
  autotaskRunId: string;
  autotaskId: string;
  trigger: AutotaskRunTrigger;
  status: string;
  createdAt: string;
  errorType?: AutotaskErrorType;
}

export interface AutotaskRunPendingData {
  status: 'pending';
}

export interface AutotaskRunThrottledData {
  status: 'throttled';
}

export interface AutotaskRunErrorData {
  status: 'error';
  message: string;
  decodedLogs?: string; // External API always returns decoded logs
  requestId?: string;
  errorType?: AutotaskErrorType;
}

export interface AutotaskRunSuccessData {
  status: 'success';
  decodedLogs?: string; // External API always returns decoded logs
  result: string;
  requestId: string;
}

export type AutotaskRunListResponse = {
  items: AutotaskRunBase[];
  next: string;
};

export type AutotaskRunListItemResponse = AutotaskRunBase;
export type AutotaskRunResponse = AutotaskRunBase &
  (AutotaskRunPendingData | AutotaskRunErrorData | AutotaskRunSuccessData | AutotaskRunThrottledData);
export type AutotaskRunFinishedResponse = AutotaskRunBase & (AutotaskRunErrorData | AutotaskRunSuccessData);

import { Network } from 'defender-base-client';

export interface BlockWatcherOptions {
  processBlockAttempts?: number;
  processBlockAttemptTimeoutMs?: number;
  processBlockBatchSize?: number;
  traceAttempts?: number;
  traceTimeoutMinTimeoutMs?: number;
  traceTimeoutMaxTimeoutMs?: number;
}

export interface BlockWatcher {
  blockWatcherId: string;
  network: Network;
  lastBlockNumber?: string;
  confirmLevel: number; // number of blocks in past to watch, 0 is latest
  lastUpdatedAt?: string;
  blockIntervalMs: number;
  paused?: boolean;
  traceBlock?: boolean;
  options?: BlockWatcherOptions;
}

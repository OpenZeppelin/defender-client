export type Network =
  | 'mainnet'
  | 'rinkeby'
  | 'ropsten'
  | 'kovan'
  | 'goerli'
  | 'xdai'
  | 'sokol'
  | 'fuse'
  | 'bsc'
  | 'bsctest'
  | 'fantom'
  | 'fantomtest'
  | 'moonbase'
  | 'moonriver'
  | 'moonbeam'
  | 'matic'
  | 'mumbai'
  | 'avalanche'
  | 'fuji'
  | 'optimism'
  | 'optimism-kovan'
  | 'arbitrum'
  | 'arbitrum-rinkeby'
  | 'celo'
  | 'alfajores'
  | 'harmony-s0'
  | 'harmony-test-s0'
  | 'aurora'
  | 'auroratest';

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

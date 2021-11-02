export type Network =
  | 'mainnet'
  | 'ropsten'
  | 'rinkeby'
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
  | 'matic'
  | 'mumbai'
  | 'avalanche'
  | 'fuji'
  | 'arbitrum'
  | 'arbitrum-rinkeby'
  | 'optimistic'
  | 'optimistic-kovan'
  | 'celo'
  | 'alfajores';

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

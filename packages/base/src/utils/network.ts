import { findKey } from 'lodash';

type PublicNetwork =
  | 'mainnet'
  | 'sepolia'
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
  | 'optimism-goerli'
  | 'arbitrum'
  | 'arbitrum-nova'
  | 'arbitrum-goerli'
  | 'celo'
  | 'alfajores'
  | 'harmony-s0'
  | 'harmony-test-s0'
  | 'aurora'
  | 'auroratest'
  | 'hedera'
  | 'hederatest'
  | 'zksync'
  | 'zksync-goerli'
  | 'base'
  | 'base-goerli'
  | 'linea'
  | 'linea-goerli';

type CustomNetwork = 'x-dfk-avax-chain' | 'x-dfk-avax-chain-test';

export type Network = PublicNetwork | CustomNetwork;

export const Networks: Network[] = [
  'mainnet',
  'sepolia',
  'goerli',
  'xdai',
  'sokol',
  'fuse',
  'bsc',
  'bsctest',
  'fantom',
  'fantomtest',
  'moonbase',
  'moonriver',
  'moonbeam',
  'matic',
  'mumbai',
  'avalanche',
  'fuji',
  'optimism',
  'optimism-goerli',
  'arbitrum',
  'arbitrum-nova',
  'arbitrum-goerli',
  'celo',
  'alfajores',
  'harmony-s0',
  'harmony-test-s0',
  'aurora',
  'auroratest',
  'hedera',
  'hederatest',
  'zksync',
  'zksync-goerli',
  'base',
  'base-goerli',
  'linea',
  'linea-goerli',
  'x-dfk-avax-chain',
  'x-dfk-avax-chain-test',
];

export function isValidNetwork(text: string): text is Network {
  return (Networks as string[]).includes(text);
}

export function fromChainId(chainId: number): Network | undefined {
  return findKey(chainIds, (number) => number === chainId) as Network | undefined;
}

export function toChainId(network: Network): number | undefined {
  return chainIds[network];
}

const chainIds: { [key in Network]: number } = {
  'mainnet': 1,
  'sepolia': 11155111,
  'goerli': 5,
  'xdai': 100,
  'sokol': 77,
  'fuse': 122,
  'bsc': 56,
  'bsctest': 97,
  'fantom': 250,
  'fantomtest': 0xfa2,
  'moonbase': 1287,
  'moonriver': 1285,
  'moonbeam': 1284,
  'matic': 137,
  'mumbai': 80001,
  'avalanche': 0xa86a,
  'fuji': 0xa869,
  'optimism': 10,
  'optimism-goerli': 420,
  'arbitrum': 42161,
  'arbitrum-nova': 42170,
  'arbitrum-goerli': 421613,
  'celo': 42220,
  'alfajores': 44787,
  'harmony-s0': 1666600000,
  'harmony-test-s0': 1666700000,
  'aurora': 1313161554,
  'auroratest': 1313161555,
  'hedera': 295,
  'hederatest': 296,
  'zksync': 324,
  'zksync-goerli': 280,
  'base': 8453,
  'base-goerli': 84531,
  'linea': 59144,
  'linea-goerli': 59140,
  'x-dfk-avax-chain': 53935,
  'x-dfk-avax-chain-test': 335,
};

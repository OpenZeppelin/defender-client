import { findKey } from 'lodash';

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
  | 'optimistic'
  | 'optimistic-kovan'
  | 'arbitrum'
  | 'arbitrum-rinkeby'
  | 'celo'
  | 'alfajores'
  | 'harmony-s0'
  | 'harmony-test-s0';

export const Networks: Network[] = [
  'mainnet',
  'rinkeby',
  'ropsten',
  'kovan',
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
  'optimistic',
  'optimistic-kovan',
  'arbitrum',
  'arbitrum-rinkeby',
  'celo',
  'alfajores',
  'harmony-s0',
  'harmony-test-s0'
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
  mainnet: 1,
  rinkeby: 4,
  ropsten: 3,
  kovan: 42,
  goerli: 5,
  xdai: 100,
  sokol: 77,
  fuse: 122,
  bsc: 56,
  bsctest: 97,
  fantom: 250,
  fantomtest: 0xfa2,
  moonbase: 1287,
  moonriver: 1285,
  moonbeam: 1284,
  matic: 137,
  mumbai: 80001,
  avalanche: 0xa86a,
  fuji: 0xa869,
  optimistic: 10,
  'optimistic-kovan': 69,
  arbitrum: 42161,
  'arbitrum-rinkeby': 421611,
  celo: 42220,
  alfajores: 44787,
  ['harmony-s0']: 1666600000,
  ['harmony-test-s0']: 1666700000,
};

import { findKey } from 'lodash';

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
  | 'mumbai';

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
  'matic',
  'mumbai',
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
  ropsten: 3,
  rinkeby: 4,
  goerli: 5,
  kovan: 42,
  xdai: 100,
  sokol: 77,
  fuse: 122,
  bsc: 56,
  bsctest: 97,
  fantom: 250,
  fantomtest: 0xfa2,
  moonbase: 1287,
  matic: 137,
  mumbai: 80001,
};

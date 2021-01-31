import { findKey } from 'lodash';

export type Network = 'mainnet' | 'ropsten' | 'rinkeby' | 'kovan' | 'goerli' | 'xdai' | 'sokol' | 'fuse';

export const Networks: Network[] = ['mainnet', 'ropsten', 'rinkeby', 'kovan', 'goerli', 'xdai', 'sokol', 'fuse'];

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
};

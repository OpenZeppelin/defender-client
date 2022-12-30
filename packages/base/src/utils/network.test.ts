import { fromChainId, isValidNetwork, Network, toChainId } from './network';

describe('utils/network', () => {
  describe('fromChainId', () => {
    test('valid chainId', () => expect(fromChainId(5)).toEqual('goerli'));
    test('invalid chainId', () => expect(fromChainId(99)).toBeUndefined());
  });

  describe('toChainId', () => {
    test('valid network', () => expect(toChainId('goerli')).toEqual(5));
    test('invalid network', () => expect(toChainId('invalid' as Network)).toBeUndefined());
  });

  describe('isValidNetwork', () => {
    test('valid network', () => expect(isValidNetwork('xdai')).toBeTruthy());
    test('invalid network', () => expect(isValidNetwork('invalid')).toBeFalsy());
  });
});

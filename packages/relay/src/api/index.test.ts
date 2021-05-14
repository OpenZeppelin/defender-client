import { AxiosInstance } from 'axios';
import { ApiRelayer } from '.';

jest.mock('defender-base-client');
jest.mock('aws-sdk');
jest.mock('axios');

type TestApiRelayer = Omit<ApiRelayer, 'api'> & {
  api: AxiosInstance;
  apiKey: string;
  apiSecret: string;
  init: () => Promise<void>;
};

describe('ApiRelayer', () => {
  let relayer: TestApiRelayer;
  let initSpy: jest.SpyInstance<Promise<void>, []>;
  const payload = {
    to: '0x0',
    gasLimit: 21000,
  };

  beforeEach(async function () {
    relayer = (new ApiRelayer({ apiKey: 'key', apiSecret: 'secret' }) as unknown) as TestApiRelayer;
    initSpy = jest.spyOn(relayer, 'init');
  });

  describe('constructor', () => {
    test('sets API key and secret', () => {
      expect(relayer.apiKey).toBe('key');
      expect(relayer.apiSecret).toBe('secret');
    });

    test("doesn't call init more than once", async () => {
      await relayer.sendTransaction(payload);
      await relayer.sendTransaction(payload);
      await relayer.sendTransaction(payload);

      expect(initSpy).toBeCalledTimes(1);
    });

    test('throw an init exception at the correct context', async () => {
      relayer.init = () => {
        throw new Error('Init failed');
      };
      await expect(relayer.sendTransaction(payload)).rejects.toThrow(/init failed/i);
      expect(relayer.api).toBe(undefined);
    });
  });

  describe('renew Id token on timeout', () => {
    beforeEach(async () => {
      await relayer.init();
    });

    test('at sendTransaction', async () => {
      relayer.api.post = jest.fn().mockImplementation(() => {
        return Promise.reject({ response: { status: 401, statusText: 'Unauthorized' } });
      });
      await relayer.sendTransaction(payload);
      expect(relayer.api.post).toBeCalledWith('/txs', payload);
      expect(initSpy).toBeCalled();
    });

    test('at sign', async () => {
      relayer.api.post = jest.fn().mockImplementation(() => {
        return Promise.reject({ response: { status: 401, statusText: 'Unauthorized' } });
      });
      await relayer.sign({ message: '0xdead' });
      expect(relayer.api.post).toBeCalledWith('/sign', { message: '0xdead' });
      expect(initSpy).toBeCalled();
    });

    test('at query', async () => {
      relayer.api.get = jest.fn().mockImplementation(() => {
        return Promise.reject({ response: { status: 401, statusText: 'Unauthorized' } });
      });
      await relayer.query('42');
      expect(relayer.api.get).toBeCalledWith('txs/42');
      expect(initSpy).toBeCalled();
    });
  });

  describe('sendTransaction', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.sendTransaction(payload);
      expect(relayer.api.post).toBeCalledWith('/txs', payload);
      expect(initSpy).toBeCalled();
    });
  });

  describe('getRelayer', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.getRelayer();
      expect(relayer.api.get).toBeCalledWith('/relayer');
      expect(initSpy).toBeCalled();
    });
  });

  describe('query', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.query('42');
      expect(relayer.api.get).toBeCalledWith('txs/42');
      expect(initSpy).toBeCalled();
    });
  });

  describe('list', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.list({ limit: 10 });
      expect(relayer.api.get).toBeCalledWith('txs', { params: { limit: 10 } });
      expect(initSpy).toBeCalled();
    });
  });

  describe('sign', () => {
    test('signs a hex string', async () => {
      await relayer.sign({ message: '0xdead' });
      expect(relayer.api.post).toBeCalledWith('/sign', { message: '0xdead' });
      expect(initSpy).toBeCalled();
    });
  });

  describe('call', () => {
    test('calls json-rpc endpoint', async () => {
      await relayer.call('eth_call', ['0xa', '0xb']);
      const payload = { jsonrpc: '2.0', id: 1, method: 'eth_call', params: ['0xa', '0xb'] };
      expect(relayer.api.post).toBeCalledWith('/relayer/jsonrpc', payload);
      expect(initSpy).toBeCalled();
    });
  });
});

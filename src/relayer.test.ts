import { AxiosInstance } from 'axios';
import { ApiRelayer } from './relayer';
import { AutotaskRelayer } from './autotask-relayer';
import * as auth from './auth';
import * as api from './api';

jest.mock('./auth');
jest.mock('./api');
jest.mock('aws-sdk');

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

  describe('sendTransaction', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.sendTransaction(payload);
      expect(relayer.api.post).toBeCalledWith('/txs', payload);
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

  describe('sign', () => {
    test('signs a hex string', async () => {
      await relayer.sign({ message: '0xdead' });
      expect(relayer.api.post).toBeCalledWith('/sign', { message: '0xdead' });
      expect(initSpy).toBeCalled();
    });
  });
});

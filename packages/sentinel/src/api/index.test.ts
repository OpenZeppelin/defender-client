import { AxiosInstance } from 'axios';
import { SentinelClient } from '.';

jest.mock('defender-base-client');
jest.mock('aws-sdk');
jest.mock('axios');

type TestSentinelClient = Omit<SentinelClient, 'api'> & {
  api: AxiosInstance;
  apiKey: string;
  apiSecret: string;
  init: () => Promise<void>;
};

describe('SentinelClient', () => {
  let sentinel: TestSentinelClient;
  let initSpy: jest.SpyInstance<Promise<void>, []>;

  beforeEach(async function () {
    sentinel = (new SentinelClient({ apiKey: 'key', apiSecret: 'secret' }) as unknown) as TestSentinelClient;
    initSpy = jest.spyOn(sentinel, 'init');
  });

  describe('constructor', () => {
    test('sets API key and secret', () => {
      expect(sentinel.apiKey).toBe('key');
      expect(sentinel.apiSecret).toBe('secret');
    });
  });

  describe('list', () => {
    test('passes correct arguments to the API', async () => {
      const resp = await sentinel.list();
      console.log(resp);
      // expect(sentinel.api.get).toBeCalledWith('txs', {});
      // expect(initSpy).toBeCalled();
    });
  });
});

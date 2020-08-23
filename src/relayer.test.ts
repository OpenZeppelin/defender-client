import { AxiosInstance } from 'axios';
import { Relayer, ApiRelayer } from './relayer';
import * as auth from './auth';
import * as api from './api';

jest.mock('./auth');
jest.mock('./api');

type TestApiRelayer = Omit<ApiRelayer, 'api'> & { api: AxiosInstance };

describe('Relayer', () => {
  let relayer: TestApiRelayer;
  const payload = {
    to: '0x0',
    gasLimit: 21000,
  };

  beforeEach(async function () {
    relayer = (new ApiRelayer({ apiKey: 'key', apiSecret: 'secret' }) as unknown) as TestApiRelayer;
  });

  describe('constructor', () => {
    test('calls init', () => {
      expect(auth.authenticate).toBeCalledWith({ Username: 'key', Password: 'secret' });
      expect(api.createApi).toBeCalled();
    });
  });

  describe('sendTransaction', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.sendTransaction(payload);
      expect(relayer.api.post).toBeCalledWith('/txs', payload);
    });
  });

  describe('query', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.query('42');
      expect(relayer.api.get).toBeCalledWith('txs/42');
    });
  });
});

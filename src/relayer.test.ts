import { AxiosInstance } from 'axios';
import { Relayer } from './relayer';
import * as auth from './auth';
import * as api from './api';

jest.mock('./auth');
jest.mock('./api');

type TestRelayer = Omit<Relayer, 'api'> & { api: AxiosInstance };

describe('Relayer', () => {
  let relayer: TestRelayer;
  const payload = {
    to: '0x0',
    gasLimit: 21000,
  };

  beforeEach(async function () {
    relayer = (new Relayer('key', 'secret') as unknown) as TestRelayer;
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      expect(relayer.api.post).toBeCalledWith('/txs', payload);
    });
  });

  describe('query', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.query('42');
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      expect(relayer.api.get).toBeCalledWith('txs/42');
    });
  });
});

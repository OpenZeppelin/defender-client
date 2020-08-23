import { AxiosInstance } from 'axios';
import { ApiRelayer, AutotaskRelayer } from './relayer';
import * as auth from './auth';
import * as api from './api';

jest.mock('./auth');
jest.mock('./api');
jest.mock('aws-sdk');

type TestApiRelayer = Omit<ApiRelayer, 'api'> & { api: AxiosInstance };
type TestAutotaskRelayer = Omit<AutotaskRelayer, 'lambda' | 'relayerARN'> & { lambda: AWS.Lambda; relayerARN: string };

describe('ApiRelayer', () => {
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

describe('AutotaskRelayer', () => {
  const credentials = {
    AccessKeyId: 'keyId',
    SecretAccessKey: 'accessKey',
    SessionToken: 'token',
  };
  let relayer: TestAutotaskRelayer;
  const payload = {
    to: '0x0',
    gasLimit: 21000,
  };

  beforeEach(async function () {
    relayer = (new AutotaskRelayer({
      credentials: JSON.stringify(credentials),
      relayerARN: 'arn',
    }) as unknown) as TestAutotaskRelayer;
  });

  describe('constructor', () => {
    test('calls init', () => {
      expect(relayer.relayerARN).toBe('arn');
      expect(relayer.lambda).not.toBeNull();
    });
  });

  describe('sendTransaction', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.sendTransaction(payload);
      expect(relayer.lambda.invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"send-tx","payload":{"to":"0x0","gasLimit":21000}}',
      });
    });
  });

  describe('query', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.query('42');
      expect(relayer.lambda.invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"get-tx","payload":"42"}',
      });
    });
  });
});

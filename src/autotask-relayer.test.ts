import { AutotaskRelayer } from './autotask-relayer';

type TestAutotaskRelayer = Omit<AutotaskRelayer, 'lambda' | 'relayerARN'> & { lambda: AWS.Lambda; relayerARN: string };

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

    test('parses lambda error correctly', async () => {
      (relayer.lambda.invoke as jest.Mock).mockImplementationOnce(() => {
        return {
          promise: () => {
            return {
              FunctionError: 'Unhandled',
              Payload: JSON.stringify({ errorType: 'Error', errorMessage: 'error msg' }),
            };
          },
        };
      });
      await expect(relayer.sendTransaction(payload)).rejects.toThrow('Error while attempting send-tx: error msg');
    });

    // if we can't make sense of the error format, we just return it
    test('parses garbage error', async () => {
      (relayer.lambda.invoke as jest.Mock).mockImplementationOnce(() => {
        return {
          promise: () => {
            return {
              FunctionError: 'Unhandled',
              Payload: 'garbage error',
            };
          },
        };
      });
      await expect(relayer.sendTransaction(payload)).rejects.toThrow('Error while attempting send-tx: garbage error');
    });
  });

  describe('getRelayer', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.getRelayer();
      expect(relayer.lambda.invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"get-self"}',
      });
    });
  });

  describe('sign', () => {
    test('passes correct arguments to the API', async () => {
      await relayer.sign({ message: 'test' });
      expect(relayer.lambda.invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"sign","payload":{"message":"test"}}',
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

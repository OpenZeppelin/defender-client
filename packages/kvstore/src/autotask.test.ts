import { KeyValueStoreAutotaskClient } from './autotask';
import Lambda from '../__mocks__/aws-sdk/clients/lambda';
import { Lambda as LambdaV3 } from '../__mocks__/@aws-sdk/client-lambda';
jest.mock('node:process', () => ({
  ...jest.requireActual('node:process'),
  version: 'v16.0.3',
}));

type TestClient = Omit<KeyValueStoreAutotaskClient, 'lambda'> & { lambda: typeof Lambda };

describe('KeyValueStoreAutotaskClient', () => {
  const credentials = {
    AccessKeyId: 'keyId',
    SecretAccessKey: 'accessKey',
    SessionToken: 'token',
  };

  let client: TestClient;

  beforeEach(async function () {
    jest.mock('aws-sdk/clients/lambda', () => Lambda);
    jest.mock('@aws-sdk/client-lambda', () => ({ Lambda: LambdaV3 }));
    client = new KeyValueStoreAutotaskClient({
      credentials: JSON.stringify(credentials),
      kvstoreARN: 'arn',
    }) as unknown as TestClient;
  });

  describe('get', () => {
    test('calls kvstore function', async () => {
      ((client.lambda as any).invoke as jest.Mock).mockImplementationOnce(() => ({
        promise: () => Promise.resolve({ Payload: JSON.stringify('myvalue') }),
      }));

      const result = await client.get('mykey');

      expect(result).toEqual('myvalue');
      expect((client.lambda as any).invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"get","key":"mykey"}',
      });
    });
  });

  describe('del', () => {
    test('calls kvstore function', async () => {
      await client.del('mykey');
      expect((client.lambda as any).invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"del","key":"mykey"}',
      });
    });
  });

  describe('put', () => {
    test('calls kvstore function', async () => {
      await client.put('mykey', 'myvalue');
      expect((client.lambda as any).invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"put","key":"mykey","value":"myvalue"}',
      });
    });
  });
});

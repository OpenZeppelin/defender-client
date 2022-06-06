import { KeyValueStoreAutotaskClient } from './autotask';
import Lambda from 'aws-sdk/clients/lambda';

jest.mock('aws-sdk/clients/lambda', () => require('../__mocks__/aws-sdk/clients/lambda'));

type TestClient = Omit<KeyValueStoreAutotaskClient, 'lambda'> & { lambda: Lambda };

describe('KeyValueStoreAutotaskClient', () => {
  const credentials = {
    AccessKeyId: 'keyId',
    SecretAccessKey: 'accessKey',
    SessionToken: 'token',
  };

  let client: TestClient;

  beforeEach(async function () {
    client = (new KeyValueStoreAutotaskClient({
      credentials: JSON.stringify(credentials),
      kvstoreARN: 'arn',
    }) as unknown) as TestClient;
  });

  describe('get', () => {
    test('calls kvstore function', async () => {
      (client.lambda.invoke as jest.Mock).mockImplementationOnce(() => ({
        promise: () => Promise.resolve({ Payload: JSON.stringify('myvalue') }),
      }));

      const result = await client.get('mykey');

      expect(result).toEqual('myvalue');
      expect(client.lambda.invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"get","key":"mykey"}',
      });
    });
  });

  describe('del', () => {
    test('calls kvstore function', async () => {
      await client.del('mykey');
      expect(client.lambda.invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"del","key":"mykey"}',
      });
    });
  });

  describe('put', () => {
    test('calls kvstore function', async () => {
      await client.put('mykey', 'myvalue');
      expect(client.lambda.invoke).toBeCalledWith({
        FunctionName: 'arn',
        InvocationType: 'RequestResponse',
        Payload: '{"action":"put","key":"mykey","value":"myvalue"}',
      });
    });
  });
});

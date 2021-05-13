import { KeyValueStoreClient } from '.';
import Lambda from 'aws-sdk/clients/lambda';

jest.mock('aws-sdk/clients/lambda', () => require('../__mocks__/aws-sdk/clients/lambda'));

type TestClient = Omit<KeyValueStoreClient, 'lambda'> & { lambda: Lambda };

describe('KeyValueStoreClient', () => {
  const credentials = {
    AccessKeyId: 'keyId',
    SecretAccessKey: 'accessKey',
    SessionToken: 'token',
  };

  let client: TestClient;

  beforeEach(async function () {
    client = (new KeyValueStoreClient({
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

    test('validates length', async () => {
      await expect(() => client.put('a'.repeat(1025), 'myvalue')).rejects.toThrowError(/key size/i);
      await expect(() => client.put('mykey', 'a'.repeat(300 * 1024 + 1))).rejects.toThrowError(/value size/i);
      expect(client.lambda.invoke).not.toHaveBeenCalled();
    });

    test('validates type', async () => {
      await expect(() => client.put((42 as unknown) as string, 'myvalue')).rejects.toThrowError(/string/i);
      await expect(() => client.put('mykey', (42 as unknown) as string)).rejects.toThrowError(/string/i);
      expect(client.lambda.invoke).not.toHaveBeenCalled();
    });
  });
});

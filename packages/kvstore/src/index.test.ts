import { KeyValueStoreClient, KeyValueStoreCreateParams } from '.';
import { KeyValueStoreAutotaskClient } from './autotask';
import { KeyValueStoreLocalClient } from './local';
import { IKeyValueStoreClient } from './types';

class TestClient extends KeyValueStoreClient {
  public getImplementation(): IKeyValueStoreClient {
    return this.implementation;
  }
}

describe('KeyValueStoreClient', () => {
  describe('create', () => {
    test('creates a local client', async () => {
      const client = new TestClient({ path: '/tmp/foo' });
      expect(client.getImplementation()).toBeInstanceOf(KeyValueStoreLocalClient);
    });

    test('creates an autotask client', async () => {
      const credentials = JSON.stringify({
        AccessKeyId: 'keyId',
        SecretAccessKey: 'accessKey',
        SessionToken: 'token',
      });

      const client = new TestClient({ credentials, kvstoreARN: 'bar' });
      expect(client.getImplementation()).toBeInstanceOf(KeyValueStoreAutotaskClient);
    });

    test('fails to create a client', async () => {
      expect(() => {
        new TestClient({} as KeyValueStoreCreateParams);
      }).toThrowError(/Invalid create params/i);
    });
  });

  describe('validate', () => {
    let client: TestClient;
    beforeEach(() => {
      client = new TestClient({ path: '/tmp/foo' });
    });

    test('validates length', async () => {
      await expect(() => client.put('a'.repeat(1025), 'myvalue')).rejects.toThrowError(/key size/i);
      await expect(() => client.put('mykey', 'a'.repeat(300 * 1024 + 1))).rejects.toThrowError(/value size/i);
    });

    test('validates type', async () => {
      await expect(() => client.put(42 as unknown as string, 'myvalue')).rejects.toThrowError(/string/i);
      await expect(() => client.put('mykey', 42 as unknown as string)).rejects.toThrowError(/string/i);
    });
  });
});

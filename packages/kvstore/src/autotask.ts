import { BaseAutotaskClient } from '@openzeppelin/defender-base-client/lib/autotask';
import { IKeyValueStoreClient, KeyValueStoreCreateParams, KeyValueStoreRequest } from './types';

export class KeyValueStoreAutotaskClient extends BaseAutotaskClient implements IKeyValueStoreClient {
  public constructor(params: KeyValueStoreCreateParams) {
    super(params.credentials, params.kvstoreARN);
  }

  public async get(key: string): Promise<string | undefined> {
    const request: KeyValueStoreRequest = { action: 'get', key };
    return this.execute(request);
  }

  public async put(key: string, value: string): Promise<void> {
    const request: KeyValueStoreRequest = { action: 'put', key, value };
    return this.execute(request);
  }

  public async del(key: string): Promise<void> {
    const request: KeyValueStoreRequest = { action: 'del', key };
    return this.execute(request);
  }
}

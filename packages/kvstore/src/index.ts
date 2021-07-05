import {
  IKeyValueStoreClient,
  isAutotaskCreateParams,
  isLocalCreateParams,
  KeyValueStoreCreateParams,
  LocalKeyValueStoreCreateParams,
} from './types';

export { KeyValueStoreCreateParams, LocalKeyValueStoreCreateParams };

export class KeyValueStoreClient implements IKeyValueStoreClient {
  protected implementation: IKeyValueStoreClient;

  public constructor(params: KeyValueStoreCreateParams | LocalKeyValueStoreCreateParams) {
    if (isAutotaskCreateParams(params)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { KeyValueStoreAutotaskClient } = require('./autotask');
      this.implementation = new KeyValueStoreAutotaskClient(params);
    } else if (isLocalCreateParams(params)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { KeyValueStoreLocalClient } = require('./local');
      this.implementation = new KeyValueStoreLocalClient(params);
    } else {
      throw new Error(`Invalid create params for KeyValueStoreClient`);
    }
  }

  public async get(key: string): Promise<string | undefined> {
    return this.implementation.get(key);
  }

  public async put(key: string, value: string): Promise<void> {
    if (typeof key !== 'string') throw new Error(`Key must be a string`);
    if (value && typeof value !== 'string') throw new Error(`Value must be a string`);
    if (key.length > 1024) throw new Error(`Key size cannot exceed 1024 characters`);
    if (value && value.length > 300 * 1024) throw new Error(`Value size cannot exceed 300 KB`);

    return this.implementation.put(key, value);
  }

  public async del(key: string): Promise<void> {
    return this.implementation.del(key);
  }
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;

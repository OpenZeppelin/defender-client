import { ensureFileSync, readJsonSync, writeJsonSync } from 'fs-extra';
import { IKeyValueStoreClient, LocalKeyValueStoreCreateParams } from './types';

type Store = Record<string, string | undefined>;

/**
 * Uses a local file for representing the store as a JSON. All fs operations
 * are synchronous to prevent race conditions on put/del operations.
 */
export class KeyValueStoreLocalClient implements IKeyValueStoreClient {
  protected path: string;

  public constructor(params: LocalKeyValueStoreCreateParams) {
    this.path = params.path;
  }

  public async get(key: string): Promise<string | undefined> {
    return this.getStore()[key];
  }

  public async put(key: string, value: string): Promise<void> {
    this.updateStore((store) => {
      store[key] = value;
    });
  }

  public async del(key: string): Promise<void> {
    this.updateStore((store) => {
      delete store[key];
    });
  }

  protected getStore(): Store {
    return readJsonSync(this.path, { throws: false }) ?? {};
  }

  protected updateStore(updater: (store: Store) => void) {
    const store = this.getStore();
    updater(store);
    ensureFileSync(this.path);
    writeJsonSync(this.path, store, { spaces: 2 });
  }
}

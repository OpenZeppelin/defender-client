import { KeyValueStoreLocalClient } from './local';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('KeyValueStoreLocalClient', () => {
  let client: KeyValueStoreLocalClient;
  let path: string;

  beforeEach(async function () {
    const dir = mkdtempSync(join(tmpdir(), 'defender-client-kvstore-test-'));
    path = join(dir, 'store.json');
    client = new KeyValueStoreLocalClient({ path });
  });

  test('reads from an empty store', async () => {
    const value = await client.get('foo');
    expect(value).toBeUndefined();
  });

  test('puts then gets', async () => {
    await client.put('foo', 'bar');
    expect(await client.get('foo')).toEqual('bar');
  });

  test('multiple puts', async () => {
    await client.put('foo1', 'bar1');
    await client.put('foo2', 'bar2');
    await client.put('foo3', 'bar3');

    expect(await client.get('foo1')).toEqual('bar1');
  });

  test('apparently concurrent puts', async () => {
    await Promise.all([client.put('foo1', 'bar1'), client.put('foo2', 'bar2'), client.put('foo3', 'bar3')]);

    expect(await client.get('foo1')).toEqual('bar1');
    expect(await client.get('foo2')).toEqual('bar2');
    expect(await client.get('foo3')).toEqual('bar3');
  });

  test('overwrites', async () => {
    await client.put('foo', 'bar');
    await client.put('foo', 'baz');
    const value = await client.get('foo');
    expect(value).toEqual('baz');
  });

  test('deletes a key', async () => {
    await client.put('foo', 'bar');
    await client.del('foo');
    const value = await client.get('foo');
    expect(value).toBeUndefined();
  });

  test('deletes non-existing key', async () => {
    await client.del('foo');
    const value = await client.get('foo');
    expect(value).toBeUndefined();
  });
});

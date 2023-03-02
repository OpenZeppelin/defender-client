import { BlockExplorerApiKeyClient } from './block-explorer-api-key';
import { CreateBlockExplorerApiKeyRequest, UpdateBlockExplorerApiKeyRequest } from '../models';
import { TestClient } from '../utils/index';

jest.mock('defender-base-client');
jest.mock('aws-sdk');
jest.mock('axios');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createAuthenticatedApi } = require('defender-base-client');

describe('Block Explorer Api Key Client', () => {
  let blockExplorerClient: TestClient<BlockExplorerApiKeyClient>;

  const createPaylod: CreateBlockExplorerApiKeyRequest = {
    key: 'random-key',
    network: 'goerli',
  };
  const updatePaylod: UpdateBlockExplorerApiKeyRequest = {
    key: 'random-key',
  };
  beforeEach(() => {
    blockExplorerClient = new BlockExplorerApiKeyClient({
      apiKey: 'key',
      apiSecret: 'secret',
    }) as unknown as TestClient<BlockExplorerApiKeyClient>;
    createAuthenticatedApi.mockClear();
  });
  describe('constructor', () => {
    it('sets API key and secret', () => {
      expect(blockExplorerClient.apiKey).toBe('key');
      expect(blockExplorerClient.apiSecret).toBe('secret');
    });

    it("doesn't call init more than once", async () => {
      await blockExplorerClient.list();
      await blockExplorerClient.list();
      await blockExplorerClient.list();
      expect(createAuthenticatedApi).toBeCalledTimes(1);
    });
    it('throws an init exception at the correct context', async () => {
      blockExplorerClient.init = () => {
        throw new Error('Init failed');
      };
      await expect(blockExplorerClient.list()).rejects.toThrow(/init failed/i);
      expect(blockExplorerClient.api).toBe(undefined);
    });
  });
  describe('renew Id token on apiCall throw', () => {
    beforeEach(async () => {
      // Call first so it's not supposed to be called again
      await blockExplorerClient.init();
    });

    it('renews token', async () => {
      jest.spyOn(blockExplorerClient.api, 'get').mockImplementationOnce(() => {
        return Promise.reject({ response: { status: 401, statusText: 'Unauthorized' } });
      });

      await blockExplorerClient.list();
      expect(blockExplorerClient.api.get).toBeCalledWith('/block-explorer-api-key');
      expect(createAuthenticatedApi).toBeCalledTimes(2); // First time and renewal
    });
  });
  describe('list', () => {
    it('calls API correctly', async () => {
      await blockExplorerClient.list();
      expect(blockExplorerClient.api.get).toBeCalledWith('/block-explorer-api-key');
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
  describe('create', () => {
    it('calls API correctly', async () => {
      await blockExplorerClient.create(createPaylod);
      expect(blockExplorerClient.api.post).toBeCalledWith('/block-explorer-api-key', createPaylod);
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
  describe('get', () => {
    it('calls API correctly', async () => {
      await blockExplorerClient.get('api-key-id');
      expect(blockExplorerClient.api.get).toBeCalledWith('/block-explorer-api-key/api-key-id');
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
  describe('update', () => {
    it('calls API correctly', async () => {
      await blockExplorerClient.update('api-key-id', updatePaylod);
      expect(blockExplorerClient.api.put).toBeCalledWith('/block-explorer-api-key/api-key-id', updatePaylod);
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
});

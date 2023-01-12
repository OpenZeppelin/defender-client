import { DeploymentConfigClient } from './deployment-config';
import { DeploymentConfigCreateRequest } from '../models';
import { TestClient } from '../utils/index';

jest.mock('defender-base-client');
jest.mock('aws-sdk');
jest.mock('axios');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createAuthenticatedApi } = require('defender-base-client');

describe('Deployment Config Client', () => {
  let deployConfigClient: TestClient<DeploymentConfigClient>;

  const createPaylod: DeploymentConfigCreateRequest = {
    relayerId: 'relayerId',
  };
  beforeEach(() => {
    deployConfigClient = new DeploymentConfigClient({
      apiKey: 'key',
      apiSecret: 'secret',
    }) as unknown as TestClient<DeploymentConfigClient>;
    createAuthenticatedApi.mockClear();
  });
  describe('constructor', () => {
    it('sets API key and secret', () => {
      expect(deployConfigClient.apiKey).toBe('key');
      expect(deployConfigClient.apiSecret).toBe('secret');
    });

    it("doesn't call init more than once", async () => {
      await deployConfigClient.list();
      await deployConfigClient.list();
      await deployConfigClient.list();
      expect(createAuthenticatedApi).toBeCalledTimes(1);
    });
    it('throws an init exception at the correct context', async () => {
      deployConfigClient.init = () => {
        throw new Error('Init failed');
      };
      await expect(deployConfigClient.list()).rejects.toThrow(/init failed/i);
      expect(deployConfigClient.api).toBe(undefined);
    });
  });
  describe('renew Id token on apiCall throw', () => {
    beforeEach(async () => {
      // Call first so it's not supposed to be called again
      await deployConfigClient.init();
    });

    it('renews token', async () => {
      jest.spyOn(deployConfigClient.api, 'get').mockImplementationOnce(() => {
        return Promise.reject({ response: { status: 401, statusText: 'Unauthorized' } });
      });

      await deployConfigClient.list();
      expect(deployConfigClient.api.get).toBeCalledWith('/deployment-config');
      expect(createAuthenticatedApi).toBeCalledTimes(2); // First time and renewal
    });
  });
  describe('list', () => {
    it('calls API correctly', async () => {
      await deployConfigClient.list();
      expect(deployConfigClient.api.get).toBeCalledWith('/deployment-config');
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
  describe('create', () => {
    it('calls API correctly', async () => {
      await deployConfigClient.create(createPaylod);
      expect(deployConfigClient.api.post).toBeCalledWith('/deployment-config', createPaylod);
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
  describe('get', () => {
    it('calls API correctly', async () => {
      await deployConfigClient.get('api-key-id');
      expect(deployConfigClient.api.get).toBeCalledWith('/deployment-config/api-key-id');
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
  describe('update', () => {
    it('calls API correctly', async () => {
      await deployConfigClient.update('api-key-id', createPaylod);
      expect(deployConfigClient.api.put).toBeCalledWith('/deployment-config/api-key-id', createPaylod);
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
});

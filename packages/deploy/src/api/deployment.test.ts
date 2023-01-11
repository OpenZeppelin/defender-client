import { DeploymentClient } from './deployment';
import { DeployContractRequest } from '../models';
import { TestClient } from '../utils/index';

jest.mock('defender-base-client');
jest.mock('aws-sdk');
jest.mock('axios');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createAuthenticatedApi } = require('defender-base-client');

describe('Deploy Client', () => {
  let deployClient: TestClient<DeploymentClient>;

  const deployCreatePayload: DeployContractRequest = {
    contractName: 'ERC20',
    contractPath: 'contracts/ERC20.sol',
    network: 'goerli',
    artifactUri: 'url',
    verifySourceCode: true,
  };
  beforeEach(() => {
    deployClient = new DeploymentClient({
      apiKey: 'key',
      apiSecret: 'secret',
    }) as unknown as TestClient<DeploymentClient>;
    createAuthenticatedApi.mockClear();
  });
  describe('constructor', () => {
    it('sets API key and secret', () => {
      expect(deployClient.apiKey).toBe('key');
      expect(deployClient.apiSecret).toBe('secret');
    });

    it("doesn't call init more than once", async () => {
      await deployClient.list();
      await deployClient.list();
      await deployClient.list();
      expect(createAuthenticatedApi).toBeCalledTimes(1);
    });
    it('throws an init exception at the correct context', async () => {
      deployClient.init = () => {
        throw new Error('Init failed');
      };
      await expect(deployClient.deploy(deployCreatePayload)).rejects.toThrow(/init failed/i);
      expect(deployClient.api).toBe(undefined);
    });
  });
  describe('renew Id token on apiCall throw', () => {
    beforeEach(async () => {
      // Call first so it's not supposed to be called again
      await deployClient.init();
    });

    it('renews token', async () => {
      jest.spyOn(deployClient.api, 'get').mockImplementationOnce(() => {
        return Promise.reject({ response: { status: 401, statusText: 'Unauthorized' } });
      });

      await deployClient.list();
      expect(deployClient.api.get).toBeCalledWith('/deployments');
      expect(createAuthenticatedApi).toBeCalledTimes(2); // First time and renewal
    });
  });
  describe('list', () => {
    it('calls API correctly', async () => {
      await deployClient.list();
      expect(deployClient.api.get).toBeCalledWith('/deployments');
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
  describe('deploy', () => {
    it('throws if no artifact', async () => {
      const payload = { ...deployCreatePayload, artifactUri: undefined };
      await expect(deployClient.deploy(payload)).rejects.toThrow(
        'Missing artifact in deploy request. Either artifactPayload or artifactUri must be included in the request.',
      );
      expect(createAuthenticatedApi).toBeCalledTimes(0);
    });
    it('calls API correctly', async () => {
      await deployClient.deploy(deployCreatePayload);
      expect(deployClient.api.post).toBeCalledWith('/deployments', deployCreatePayload);
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
  describe('get', () => {
    it('calls API correctly', async () => {
      await deployClient.get('deploy-id');
      expect(deployClient.api.get).toBeCalledWith('/deployments/deploy-id');
      expect(createAuthenticatedApi).toBeCalled();
    });
  });
});

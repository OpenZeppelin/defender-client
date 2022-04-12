import { AxiosInstance } from 'axios';

abstract class MockBaseApiClient extends jest.requireActual('defender-base-client').BaseApiClient {
  private api: AxiosInstance | undefined;
  protected async init(): Promise<void> {
    this.api = module.exports.createAuthenticatedApi();
  }
}

module.exports = {
  authenticate: jest.fn(),
  createAuthenticatedApi: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  createApi: jest.fn(() => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  BaseApiClient: MockBaseApiClient,
};

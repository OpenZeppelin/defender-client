import { AxiosError, AxiosInstance } from 'axios';
import { createAuthenticatedApi } from './api';
import { ClientCredentials, clientIsAuthenticatedInternally } from './auth';

function sessionTokenHasExpired(httpError: AxiosError) {
  return httpError.response?.status === 401 && httpError.response?.statusText === 'Unauthorized';
}

export abstract class BaseApiClient {
  private api: Promise<AxiosInstance> | undefined;
  private credentials: ClientCredentials;
  private isAuthenticatedInternally: boolean;

  protected abstract getPoolId(): string;
  protected abstract getPoolClientId(): string;
  protected abstract getApiUrl(): string;

  public constructor(credentials: ClientCredentials) {
    if (clientIsAuthenticatedInternally(credentials)) {
      this.credentials = { ...credentials };
      this.isAuthenticatedInternally = true;
    } else {
      if (!credentials.apiKey) throw new Error(`API key is required`);
      if (!credentials.apiSecret) throw new Error(`API secret is required`);

      this.credentials = { ...credentials };
      this.isAuthenticatedInternally = false;
    }
  }

  protected async init(): Promise<AxiosInstance> {
    if (!this.api) {
      this.api = createAuthenticatedApi({
        credentials: this.credentials,
        poolData: { UserPoolId: this.getPoolId(), ClientId: this.getPoolClientId() },
        apiUrl: this.getApiUrl(),
      });
    }
    return this.api;
  }

  private async recreateSession() {
    this.api = undefined;
    return await this.init();
  }

  private async retryWithApiNewSession<T>(apiCallFunction: (api: AxiosInstance) => Promise<T>) {
    const newApiSession = await this.recreateSession();
    return await apiCallFunction(newApiSession);
  }

  protected async apiCall<T>(apiCallFunction: (api: AxiosInstance) => Promise<T>): Promise<T> {
    const api = await this.init();
    try {
      return await apiCallFunction(api);
    } catch (error) {
      if (sessionTokenHasExpired(error as AxiosError)) {
        if (this.isAuthenticatedInternally) {
          throw new Error('Client expired');
        } else {
          return await this.retryWithApiNewSession(apiCallFunction);
        }
      }
      throw error;
    }
  }
}

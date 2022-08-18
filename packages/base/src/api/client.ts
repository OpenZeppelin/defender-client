import { AxiosInstance } from 'axios';
import { createAuthenticatedApi } from './api';

export abstract class BaseApiClient {
  private api: Promise<AxiosInstance> | undefined;
  private apiKey: string;
  private apiSecret: string;

  protected abstract getPoolId(): string;
  protected abstract getPoolClientId(): string;
  protected abstract getApiUrl(): string;

  public constructor(params: { apiKey: string; apiSecret: string }) {
    if (!params.apiKey) throw new Error(`API key is required`);
    if (!params.apiSecret) throw new Error(`API secret is required`);

    this.apiKey = params.apiKey;
    this.apiSecret = params.apiSecret;
  }

  protected async init(): Promise<AxiosInstance> {
    if (!this.api) {
      const userPass = { Username: this.apiKey, Password: this.apiSecret };
      const poolData = { UserPoolId: this.getPoolId(), ClientId: this.getPoolClientId() };
      this.api = createAuthenticatedApi(userPass, poolData, this.getApiUrl());
    }
    return this.api;
  }

  protected async apiCall<T>(fn: (api: AxiosInstance) => Promise<T>): Promise<T> {
    const api = await this.init();
    try {
      return await fn(api);
    } catch (error) {
      // this means ID token has expired so we'll recreate session and try again
      if (error.response && error.response.status === 401 && error.response.statusText === 'Unauthorized') {
        this.api = undefined;
        const api = await this.init();
        return await fn(api);
      }
      throw error;
    }
  }
}

import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { AxiosInstance } from 'axios';
import https from 'https';

import { createAuthenticatedApi } from './api';
import { authenticate, refreshSession } from './auth';

export abstract class BaseApiClient {
  private api: AxiosInstance | undefined;
  private apiKey: string;
  private session: CognitoUserSession | undefined;
  private apiSecret: string;
  private httpsAgent?: https.Agent;

  protected abstract getPoolId(): string;
  protected abstract getPoolClientId(): string;
  protected abstract getApiUrl(): string;

  public constructor(params: { apiKey: string; apiSecret: string; httpsAgent?: https.Agent }) {
    if (!params.apiKey) throw new Error(`API key is required`);
    if (!params.apiSecret) throw new Error(`API secret is required`);

    this.apiKey = params.apiKey;
    this.apiSecret = params.apiSecret;
    this.httpsAgent = params.httpsAgent;
  }

  protected async init(): Promise<AxiosInstance> {
    if (!this.api) {
      const userPass = { Username: this.apiKey, Password: this.apiSecret };
      const poolData = { UserPoolId: this.getPoolId(), ClientId: this.getPoolClientId() };
      this.session = await authenticate(userPass, poolData);
      this.api = createAuthenticatedApi(userPass.Username, this.session, this.getApiUrl(), this.httpsAgent);
    }
    return this.api;
  }

  protected async refresh(): Promise<AxiosInstance> {
    if (!this.session) {
      return this.init();
    }
    try {
      const userPass = { Username: this.apiKey, Password: this.apiSecret };
      const poolData = { UserPoolId: this.getPoolId(), ClientId: this.getPoolClientId() };
      this.session = await refreshSession(userPass, poolData, this.session);
      this.api = createAuthenticatedApi(userPass.Username, this.session, this.getApiUrl(), this.httpsAgent);

      return this.api;
    } catch (e) {
      return this.init();
    }
  }

  protected async apiCall<T>(fn: (api: AxiosInstance) => Promise<T>): Promise<T> {
    const api = await this.init();
    try {
      return await fn(api);
    } catch (error: any) {
      // this means ID token has expired so we'll recreate session and try again
      if (error.response && error.response.status === 401 && error.response.statusText === 'Unauthorized') {
        this.api = undefined;

        const api = await this.refresh();
        return await fn(api);
      }
      throw error;
    }
  }
}

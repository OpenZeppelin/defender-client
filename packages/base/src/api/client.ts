import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { AxiosInstance } from 'axios';
import https from 'https';

import { createAuthenticatedApi } from './api';
import { authenticate, refreshSession } from './auth';

export type ApiVersion = 'v1' | 'v2';

export abstract class BaseApiClient {
  private api: AxiosInstance | undefined;
  private version: ApiVersion | undefined;
  private apiKey: string;
  private session: CognitoUserSession | undefined;
  private apiSecret: string;
  private httpsAgent?: https.Agent;

  protected abstract getPoolId(): string;
  protected abstract getPoolClientId(): string;
  protected abstract getApiUrl(v: ApiVersion): string;

  public constructor(params: { apiKey: string; apiSecret: string; httpsAgent?: https.Agent }) {
    if (!params.apiKey) throw new Error(`API key is required`);
    if (!params.apiSecret) throw new Error(`API secret is required`);

    this.apiKey = params.apiKey;
    this.apiSecret = params.apiSecret;
    this.httpsAgent = params.httpsAgent;
  }

  protected async init(v: ApiVersion = 'v1'): Promise<AxiosInstance> {
    if (!this.api || this.version !== v) {
      const userPass = { Username: this.apiKey, Password: this.apiSecret };
      const poolData = { UserPoolId: this.getPoolId(), ClientId: this.getPoolClientId() };
      this.session = await authenticate(userPass, poolData);
      this.api = createAuthenticatedApi(userPass.Username, this.session, this.getApiUrl(v), this.httpsAgent);
      this.version = v;
    }
    return this.api;
  }

  protected async refresh(v: ApiVersion = 'v1'): Promise<AxiosInstance> {
    if (!this.session) {
      return this.init(v);
    }
    try {
      const userPass = { Username: this.apiKey, Password: this.apiSecret };
      const poolData = { UserPoolId: this.getPoolId(), ClientId: this.getPoolClientId() };
      this.session = await refreshSession(userPass, poolData, this.session);
      this.api = createAuthenticatedApi(userPass.Username, this.session, this.getApiUrl(v), this.httpsAgent);

      return this.api;
    } catch (e) {
      return this.init(v);
    }
  }

  protected async apiCall<T>(fn: (api: AxiosInstance) => Promise<T>, v: ApiVersion = 'v1'): Promise<T> {
    const api = await this.init(v);
    try {
      return await fn(api);
    } catch (error: any) {
      // this means ID token has expired so we'll recreate session and try again
      if (error.response && error.response.status === 401 && error.response.statusText === 'Unauthorized') {
        this.api = undefined;

        const api = await this.refresh(v);
        return await fn(api);
      }
      throw error;
    }
  }
}

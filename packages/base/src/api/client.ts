import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { AxiosInstance } from 'axios';
import https from 'https';

import { createAuthenticatedApi } from './api';
import { authenticate, refreshSession } from './auth';
import { AuthType, authenticateV2, refreshSessionV2 } from './auth-v2';

export type ApiVersion = 'v1' | 'v2';

export type AuthConfig = {
  useCredentialsCaching: boolean;
  type: AuthType;
};

export type BaseApiClientParams = {
  apiKey: string;
  apiSecret: string;
  httpsAgent?: https.Agent;
  authConfig?: AuthConfig;
};

export type ClientParams = {
  apiKey: string;
  apiSecret: string;
  httpsAgent?: https.Agent;
  useCredentialsCaching?: boolean;
};

export abstract class BaseApiClient {
  private api: AxiosInstance | undefined;
  private version: ApiVersion | undefined;
  private apiKey: string;
  private session: CognitoUserSession | undefined;
  private sessionV2: { accessToken: string; refreshToken: string } | undefined;
  private apiSecret: string;
  private httpsAgent?: https.Agent;
  private authConfig: AuthConfig;

  protected abstract getPoolId(): string;
  protected abstract getPoolClientId(): string;
  protected abstract getApiUrl(v: ApiVersion, type?: AuthType): string;

  public constructor(params: BaseApiClientParams) {
    if (!params.apiKey) throw new Error(`API key is required`);
    if (!params.apiSecret) throw new Error(`API secret is required`);

    this.apiKey = params.apiKey;
    this.apiSecret = params.apiSecret;
    this.httpsAgent = params.httpsAgent;
    this.authConfig = params.authConfig ?? { useCredentialsCaching: false, type: 'admin' };
  }

  private async getAccessToken(): Promise<string> {
    const userPass = { Username: this.apiKey, Password: this.apiSecret };
    const poolData = { UserPoolId: this.getPoolId(), ClientId: this.getPoolClientId() };
    this.session = await authenticate(userPass, poolData);
    return this.session.getAccessToken().getJwtToken();
  }

  private async getAccessTokenV2(): Promise<string> {
    if (!this.authConfig.type) throw new Error('Auth type is required to authenticate in auth v2');
    const credentials = {
      apiKey: this.apiKey,
      secretKey: this.apiSecret,
      type: this.authConfig.type,
    };
    this.sessionV2 = await authenticateV2(credentials, this.getApiUrl('v1', 'admin'));
    return this.sessionV2.accessToken;
  }

  private async refreshSession(): Promise<string> {
    if (!this.session) return this.getAccessToken();
    const userPass = { Username: this.apiKey, Password: this.apiSecret };
    const poolData = { UserPoolId: this.getPoolId(), ClientId: this.getPoolClientId() };
    this.session = await refreshSession(userPass, poolData, this.session);
    return this.session.getAccessToken().getJwtToken();
  }

  private async refreshSessionV2(): Promise<string> {
    if (!this.authConfig.type) throw new Error('Auth type is required to refresh session in auth v2');
    if (!this.sessionV2) return this.getAccessTokenV2();
    const credentials = {
      apiKey: this.apiKey,
      secretKey: this.apiSecret,
      refreshToken: this.sessionV2.refreshToken,
      type: this.authConfig.type,
    };
    this.sessionV2 = await refreshSessionV2(credentials, this.getApiUrl('v1' ,'admin'));
    return this.sessionV2.accessToken;
  }

  protected async init(v: ApiVersion = 'v1'): Promise<AxiosInstance> {
    if (!this.api || this.version !== v) {
      const accessToken = this.authConfig.useCredentialsCaching
        ? await this.getAccessTokenV2()
        : await this.getAccessToken();
      this.api = createAuthenticatedApi(this.apiKey, accessToken, this.getApiUrl(v, 'admin'), this.httpsAgent);
      this.version = v;
    }
    return this.api;
  }

  protected async refresh(v: ApiVersion = 'v1'): Promise<AxiosInstance> {
    if (!this.session && !this.sessionV2) {
      return this.init(v);
    }
    try {
      const accessToken = this.authConfig.useCredentialsCaching
        ? await this.refreshSessionV2()
        : await this.refreshSession();
      this.api = createAuthenticatedApi(this.apiKey, accessToken, this.getApiUrl(v, 'admin'), this.httpsAgent);

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

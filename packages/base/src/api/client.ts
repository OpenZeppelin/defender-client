import { AxiosInstance } from 'axios';
import https from 'https';
import { createAuthenticatedApi } from './api';
import { AuthType, authenticateV2, refreshSessionV2 } from './auth-v2';
import { authenticate, refreshSession } from './auth';
import { CognitoUserSession } from 'amazon-cognito-identity-js';

export type AuthConfig = {
  useCredentialsCaching: boolean;
  type: AuthType;
};

export abstract class BaseApiClient {
  private api: Promise<AxiosInstance> | undefined;
  private apiKey: string;
  private apiSecret: string;
  private session: CognitoUserSession | undefined;
  private sessionV2: { accessToken: string; refreshToken: string } | undefined;
  private httpsAgent?: https.Agent;
  private authConfig: AuthConfig;

  protected abstract getPoolId(): string;
  protected abstract getPoolClientId(): string;
  protected abstract getApiUrl(type?: AuthType): string;

  public constructor(params: { apiKey: string; apiSecret: string; httpsAgent?: https.Agent; authConfig?: AuthConfig }) {
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
    this.sessionV2 = await authenticateV2(credentials, this.getApiUrl('admin'));
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
    const auth = await refreshSessionV2(credentials, this.getApiUrl('admin'));
    return auth.accessToken;
  }

  protected async init(): Promise<AxiosInstance> {
    if (!this.api) {
      const accessToken = this.authConfig.useCredentialsCaching
        ? await this.getAccessTokenV2()
        : await this.getAccessToken();
      this.api = createAuthenticatedApi(this.apiKey, accessToken, this.getApiUrl('admin'), this.httpsAgent);
    }
    return this.api;
  }

  protected async apiCall<T>(fn: (api: AxiosInstance) => Promise<T>): Promise<T> {
    const api = await this.init();
    try {
      return await fn(api);
    } catch (error) {
      const errAny = error as any;
      // this means ID token has expired so we'll recreate session and try again
      if (errAny.response && errAny.response.status === 401 && errAny.response.statusText === 'Unauthorized') {
        this.api = undefined;
        const api = await this.init();
        return await fn(api);
      }
      throw error;
    }
  }
}

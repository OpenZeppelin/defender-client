import { BaseApiClient } from '@openzeppelin/defender-base-client';

export class PlatformApiClient extends BaseApiClient {
  protected getPoolId(): string {
    return process.env.PLATFORM_POOL_ID || 'us-west-2_94f3puJWv';
  }

  protected getPoolClientId(): string {
    return process.env.PLATFORM_POOL_CLIENT_ID || '40e58hbc7pktmnp9i26hh5nsav';
  }

  protected getApiUrl(): string {
    return process.env.PLATFORM_API_URL || 'https://defender-api.openzeppelin.com/deployment/';
  }
}

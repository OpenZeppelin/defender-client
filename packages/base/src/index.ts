export { createApi, createAuthenticatedApi } from './api/api';
export { authenticate } from './api/auth';
export { BaseApiClient, ApiVersion, AuthConfig } from './api/client';
export { AuthType } from './api/auth-v2';
export * from './utils/network';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;

export const DEFENDER_APP_URL = 'https://defender.openzeppelin.com';

export { createApi, createAuthenticatedApi } from './api/api';
export { getAuthenticationToken } from './api/auth';
export { BaseApiClient } from './api/client';
export * from './utils/network';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const VERSION = require('../package.json').version;

export const DEFENDER_APP_URL = 'https://defender.openzeppelin.com';

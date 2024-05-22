import retry from 'async-retry';
import { createUnauthorizedApi } from './api';
import { DefenderApiResponseError } from './api-error';

export type AuthType = 'admin' | 'relay';

export type AuthCredentials = {
  apiKey: string;
  secretKey: string;
  type: AuthType;
};

export type RefreshCredentials = {
  apiKey: string;
  secretKey: string;
  refreshToken: string;
  type: AuthType;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export async function authenticateV2(credentials: AuthCredentials, apiUrl: string): Promise<AuthResponse> {
  const api = createUnauthorizedApi(apiUrl);
  try {
    return await retry(() => api.post('/auth/login', credentials), { retries: 3 });
  } catch (err) {
    const errorMessage = (err as DefenderApiResponseError).response.statusText || err;
    throw new Error(`Failed to get a token for the API key ${credentials.apiKey}: ${errorMessage}`);
  }
}

export async function refreshSessionV2(credentials: RefreshCredentials, apiUrl: string): Promise<AuthResponse> {
  const api = createUnauthorizedApi(apiUrl);
  try {
    return await retry(() => api.post('/auth/refresh-token', credentials), { retries: 3 });
  } catch (err) {
    const errorMessage = (err as DefenderApiResponseError).response.statusText || err;
    throw new Error(`Failed to refresh token for the API key ${credentials.apiKey}: ${errorMessage}`);
  }
}
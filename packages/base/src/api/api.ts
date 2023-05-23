import { CognitoUserSession } from 'amazon-cognito-identity-js';
import axios, { AxiosError, AxiosInstance } from 'axios';
import https from 'https';

import { DefenderApiResponseError } from './api-error';

export function rejectWithDefenderApiError(axiosError: AxiosError): Promise<never> {
  return Promise.reject(new DefenderApiResponseError(axiosError));
}

export function createApi(key: string, token: string, apiUrl: string, httpsAgent?: https.Agent): AxiosInstance {
  const instance = axios.create({
    baseURL: apiUrl,
    headers: {
      'X-Api-Key': key,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    httpsAgent,
  });

  instance.interceptors.response.use(({ data }) => data, rejectWithDefenderApiError);
  return instance;
}

export function createAuthenticatedApi(
  username: string,
  session: CognitoUserSession,
  apiUrl: string,
  httpsAgent?: https.Agent,
): AxiosInstance {
  const accessToken = session.getAccessToken().getJwtToken();

  return createApi(username, accessToken, apiUrl, httpsAgent);
}

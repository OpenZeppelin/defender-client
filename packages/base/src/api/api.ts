import axios, { AxiosError, AxiosInstance } from 'axios';
import https from 'https';
import { DefenderApiResponseError } from './api-error';

export function rejectWithDefenderApiError(axiosError: AxiosError): Promise<never> {
  return Promise.reject(new DefenderApiResponseError(axiosError));
}

export function createApi(
  apiUrl: string,
  key?: string,
  token?: string,
  httpsAgent?: https.Agent,
  headers?: Record<string, string>,
): AxiosInstance {
  const authHeaders =
    key && token
      ? {
          'X-Api-Key': key,
          Authorization: `Bearer ${token}`,
        }
      : {};

  const instance = axios.create({
    baseURL: apiUrl,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
    httpsAgent,
  });
  instance.interceptors.response.use(({ data }) => data, rejectWithDefenderApiError);
  return instance;
}

export async function createAuthenticatedApi(
  username: string,
  accessToken: string,
  apiUrl: string,
  httpsAgent?: https.Agent,
): Promise<AxiosInstance> {
  return createApi(apiUrl, username, accessToken, httpsAgent);
}

export function createUnauthorizedApi(
  apiUrl: string,
  httpsAgent?: https.Agent,
  headers?: Record<string, string>,
): AxiosInstance {
  return createApi(apiUrl, undefined, undefined, httpsAgent, headers);
}

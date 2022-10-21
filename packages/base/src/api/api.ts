import axios, { AxiosError, AxiosInstance } from 'axios';
import { DefenderApiResponseError } from './api-error';
import { ClientCredentials, clientIsAuthenticatedWithJwt, getAuthenticationToken, PoolData } from './auth';

export function rejectWithDefenderApiError(axiosError: AxiosError): Promise<never> {
  return Promise.reject(new DefenderApiResponseError(axiosError));
}

export function createApi({
  apiKey,
  apiUrl,
  authenticationToken,
}: {
  apiUrl: string;
  authenticationToken: string;
  apiKey: string;
}): AxiosInstance {
  const instance = axios.create({
    baseURL: apiUrl,
    headers: {
      'X-Api-Key': apiKey,
      Authorization: `Bearer ${authenticationToken}`,
      'Content-Type': 'application/json',
      'Defender-Origin': process.env.DEFENDER_ORIGIN,
    },
  });

  instance.interceptors.response.use(({ data }) => data, rejectWithDefenderApiError);
  return instance;
}

export async function createAuthenticatedApi({
  credentials,
  poolData,
  apiUrl,
}: {
  credentials: ClientCredentials;
  poolData: PoolData;
  apiUrl: string;
}): Promise<AxiosInstance> {
  const authenticationToken = clientIsAuthenticatedWithJwt(credentials)
    ? credentials.jwt
    : await getAuthenticationToken(credentials, poolData);

  return createApi({
    apiUrl,
    apiKey: credentials.apiKey,
    authenticationToken,
  });
}

import axios, { AxiosError, AxiosInstance } from 'axios';
import { DefenderApiResponseError } from './api-error';
import { ClientCredentials, clientIsAuthenticatedInternally, getAuthenticationToken, PoolData } from './auth';

export function rejectWithDefenderApiError(axiosError: AxiosError): Promise<never> {
  return Promise.reject(new DefenderApiResponseError(axiosError));
}

export function createApi({
  apiKeyId,
  apiUrl,
  authenticationToken,
}: {
  apiUrl: string;
  authenticationToken: string;
  apiKeyId?: string;
}): AxiosInstance {
  const instance = axios.create({
    baseURL: apiUrl,
    headers: {
      Authorization: `Bearer ${authenticationToken}`,
      'Content-Type': 'application/json',
      ...(apiKeyId && { 'X-Api-Key': apiKeyId }),
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
  if (clientIsAuthenticatedInternally(credentials)) {
    return createApi({
      apiUrl,
      authenticationToken: credentials.jwt,
    });
  } else {
    return createApi({
      apiUrl,
      authenticationToken: await getAuthenticationToken(credentials, poolData),
      apiKeyId: credentials.apiKey,
    });
  }
}

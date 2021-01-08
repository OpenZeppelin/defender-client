import axios, { AxiosInstance } from 'axios';
import { pick } from 'lodash';
import { authenticate, PoolData, UserPass } from './auth';

export function createApi(key: string, token: string, apiUrl: string): AxiosInstance {
  const instance = axios.create({
    baseURL: apiUrl,
    headers: {
      'X-Api-Key': key,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.response.use(
    (response) => response.data,
    (error) =>
      Promise.reject({
        response: pick(error.response, 'status', 'statusText', 'data'),
        message: error.message,
        request: pick(error.request, 'path', 'method'),
      }),
  );

  return instance;
}

export async function createAuthenticatedApi(
  userPass: UserPass,
  poolData: PoolData,
  apiUrl: string,
): Promise<AxiosInstance> {
  const token = await authenticate(userPass, poolData);
  const api = createApi(userPass.Username, token, apiUrl);
  return api;
}

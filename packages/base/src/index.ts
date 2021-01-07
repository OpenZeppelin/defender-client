import { AxiosInstance } from 'axios';
import { createApi } from './api/api';
import { UserPass, PoolData, authenticate } from './api/auth';

export { authenticate };
export { createApi };

export async function createAuthenticatedApi(userPass: UserPass, poolData: PoolData, apiUrl: string): Promise<AxiosInstance> {
  const token = await authenticate(userPass, poolData);
  const api = createApi(userPass.Username, token, apiUrl);
  return api;
}
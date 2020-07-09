import axios, { AxiosInstance } from 'axios';
import config from './config';
import { pick } from 'lodash';

export function createApi(key: string, token: string): AxiosInstance {
  const instance = axios.create({
    baseURL: config.ApiUrl,
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

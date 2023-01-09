import { AxiosInstance } from 'axios';

export type TestClient<T> = Omit<T, 'api'> & {
  api: AxiosInstance;
  apiKey: string;
  apiSecret: string;
  init: () => Promise<void>;
};

import { authenticate } from './auth';
import { createApi } from './api';
import { AxiosInstance } from 'axios';

export type Address = string;
export type BigUInt = string | number;
export type Hex = string;
export type Speed = 'safeLow' | 'average' | 'fast' | 'fastest';

export type RelayerTransactionPayload = {
  to: Address;
  value?: BigUInt;
  data?: Hex;
  speed?: Speed;
  gasLimit: BigUInt;
};

export type RelayerTransactionObject = {};

export class Relayer {
  private token!: string;
  private api!: AxiosInstance;
  private initialization: Promise<void>;

  public constructor(private ApiKey: string, private ApiSecret: string) {
    this.initialization = this.init();
  }

  private async init(): Promise<void> {
    this.token = await authenticate({
      Username: this.ApiKey,
      Password: this.ApiSecret,
    });
    this.api = createApi(this.ApiKey, this.token);
  }

  public async sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransactionObject> {
    await this.initialization;
    return (await this.api.post('/txs', payload)) as RelayerTransactionObject;
  }

  public async query(id: string): Promise<RelayerTransactionObject> {
    await this.initialization;
    return (await this.api.get(`txs/${id}`)) as RelayerTransactionObject;
  }
}

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

// from openzeppelin/defender/models/src/types/tx.res.ts
export type RelayerTransaction = {
  transactionId: string;
  hash: string;
  to: Address;
  from: Address;
  value: string;
  data: string;
  gasPrice: number;
  gasLimit: number;
  nonce: number;
  status: string;
  chainId: number;
};

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

  public async sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    await this.initialization;
    return (await this.api.post('/txs', payload)) as RelayerTransaction;
  }

  public async query(id: string): Promise<RelayerTransaction> {
    await this.initialization;
    return (await this.api.get(`txs/${id}`)) as RelayerTransaction;
  }
}

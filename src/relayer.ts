import { authenticate } from './auth';
import { createApi } from './api';
import { AxiosInstance } from 'axios';

export type Address = string;
export type BigUInt = string | number;
export type Hex = string;
export type Speed = 'safeLow' | 'average' | 'fast' | 'fastest';
export type Status = 'pending' | 'sent' | 'submitted' | 'inmempool' | 'mined' | 'confirmed';

export type RelayerTransactionPayload = {
  to: Address;
  value?: BigUInt;
  data?: Hex;
  speed?: Speed;
  gasLimit: BigUInt;
};

export interface SignMessagePayload {
  message: Hex;
}

export interface SignedMessagePayload {
  sig: Hex;
  r: Hex;
  s: Hex;
  v: number;
}

export interface RelayerModel {
  relayerId: string;
  name: string;
  address: string;
  network: string;
  paused: boolean;
  createdAt: string;
  pendingTxCost: string;
}

// from openzeppelin/defender/models/src/types/tx.res.ts
export type RelayerTransaction = {
  transactionId: string;
  hash: string;
  to: Address;
  from: Address;
  value: string;
  data: string;
  speed: Speed;
  gasPrice: number;
  gasLimit: number;
  nonce: number;
  status: Status;
  chainId: number;
};

export type RelayerParams = ApiRelayerParams | AutotaskRelayerParams;
export type ApiRelayerParams = { apiKey: string; apiSecret: string };
export type AutotaskRelayerParams = { credentials: string; relayerARN: string };

export type JsonRpcResponse = {
  id: number | null;
  jsonrpc: '2.0';
  result: any;
  error?: {
    code: number;
    message: string;
  };
}

export type JsonRpcRequest = {
  id: number;
  jsonrpc: '2.0';
  method: string;
  params: string[];
}

function isAutotaskCredentials(
  credentials: AutotaskRelayerParams | ApiRelayerParams,
): credentials is AutotaskRelayerParams {
  const autotaskCredentials = credentials as AutotaskRelayerParams;
  return !!autotaskCredentials.credentials;
}

function isApiCredentials(credentials: AutotaskRelayerParams | ApiRelayerParams): credentials is ApiRelayerParams {
  const apiCredentials = credentials as ApiRelayerParams;
  return !!apiCredentials.apiKey && !!apiCredentials.apiSecret;
}

export interface IRelayer {
  getRelayer(): Promise<RelayerModel>;
  sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction>;
  query(id: string): Promise<RelayerTransaction>;
  sign(payload: SignMessagePayload): Promise<SignedMessagePayload>;
  call(method: string, params: string[]): Promise<JsonRpcResponse>;
}

export class ApiRelayer implements IRelayer {
  private token!: string;
  private api!: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private jsonRpcRequestNextId: number;

  public constructor(params: ApiRelayerParams) {
    if (!params.apiKey) throw new Error(`API key is required`);
    if (!params.apiSecret) throw new Error(`API secret is required`);

    this.apiKey = params.apiKey;
    this.apiSecret = params.apiSecret;
    this.jsonRpcRequestNextId = 1;
  }

  private async init(): Promise<void> {
    this.token = await authenticate({
      Username: this.apiKey,
      Password: this.apiSecret,
    });
    this.api = createApi(this.apiKey, this.token);
  }

  private async wrapApiCall<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.api) await this.init();
    try {
      return await fn();
    } catch (error) {
      // this means ID token has expired so we'll recreate session and try again
      if (error.response.status === 401 && error.response.statusText === 'Unauthorized') {
        await this.init();
        return await fn();
      }
      throw error;
    }
  }

  public async getRelayer(): Promise<RelayerModel> {
    return this.wrapApiCall(async () => {
      return (await this.api.get('/relayer')) as RelayerModel;
    });
  }

  public async sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.wrapApiCall(async () => {
      return (await this.api.post('/txs', payload)) as RelayerTransaction;
    });
  }

  public async sign(payload: SignMessagePayload): Promise<SignedMessagePayload> {
    return this.wrapApiCall(async () => {
      return (await this.api.post('/sign', payload)) as SignedMessagePayload;
    });
  }

  public async query(id: string): Promise<RelayerTransaction> {
    return this.wrapApiCall(async () => {
      return (await this.api.get(`txs/${id}`)) as RelayerTransaction;
    });
  }

  public async call(method: string, params: string[]): Promise<JsonRpcResponse> {
    return this.wrapApiCall(async () => {
      return (await this.api.post(
        `relayer/jsonrpc`, 
        { method, params, jsonrpc: '2.0', id: this.jsonRpcRequestNextId++ }
      )) as JsonRpcResponse;
    });
  }
}

export class Relayer implements IRelayer {
  private relayer: IRelayer;

  public constructor(credentials: RelayerParams) {
    if (isAutotaskCredentials(credentials)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { AutotaskRelayer } = require('./autotask-relayer');
      this.relayer = new AutotaskRelayer(credentials);
    } else if (isApiCredentials(credentials)) {
      this.relayer = new ApiRelayer(credentials);
    } else {
      throw new Error(
        `Missing credentials for creating a Relayer instance. If you are running this code in an Autotask, make sure you pass the "credentials" parameter from the handler to the Relayer constructor. If you are running this on your own process, then pass an object with the "apiKey" and "apiSecret" generated by the relayer.`,
      );
    }
  }

  public getRelayer(): Promise<RelayerModel> {
    return this.relayer.getRelayer();
  }

  public sign(payload: SignMessagePayload): Promise<SignedMessagePayload> {
    return this.relayer.sign(payload);
  }

  public sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.relayer.sendTransaction(payload);
  }

  public query(id: string): Promise<RelayerTransaction> {
    return this.relayer.query(id);
  }

  public call(method: string, params: string[]): Promise<JsonRpcResponse> {
    return this.relayer.call(method, params);
  }
}

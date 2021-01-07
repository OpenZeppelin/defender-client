import { createAuthenticatedApi } from 'defender-base-client';
import { AxiosInstance } from 'axios';
import {
  ApiRelayerParams,
  IRelayer,
  JsonRpcResponse,
  RelayerModel,
  RelayerTransaction,
  RelayerTransactionPayload,
  SignedMessagePayload,
  SignMessagePayload,
} from '../relayer';

export const RelayerPoolId = () => process.env.DEFENDER_RELAY_POOL_ID || 'us-west-2_iLmIggsiy';
export const RelayerPoolClientId = () => process.env.DEFENDER_RELAY_POOL_CLIENT_ID || '1bpd19lcr33qvg5cr3oi79rdap';
export const RelayerApiUrl = () => process.env.DEFENDER_RELAY_API_URL || 'http://api.defender.openzeppelin.com/';

export class ApiRelayer implements IRelayer {
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
    const userPass = { Username: this.apiKey, Password: this.apiSecret };
    const poolData = { UserPoolId: RelayerPoolId(), ClientId: RelayerPoolClientId() };
    this.api = await createAuthenticatedApi(userPass, poolData, RelayerApiUrl());
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
      return (await this.api.post(`/relayer/jsonrpc`, {
        method,
        params,
        jsonrpc: '2.0',
        id: this.jsonRpcRequestNextId++,
      })) as JsonRpcResponse;
    });
  }
}

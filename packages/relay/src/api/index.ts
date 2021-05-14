import { BaseApiClient } from 'defender-base-client';
import {
  ApiRelayerParams,
  IRelayer,
  JsonRpcResponse,
  ListTransactionsRequest,
  RelayerModel,
  RelayerTransaction,
  RelayerTransactionPayload,
  SignedMessagePayload,
  SignMessagePayload,
} from '../relayer';

export const RelayerApiUrl = () => process.env.DEFENDER_RELAY_API_URL || 'https://api.defender.openzeppelin.com/';

export class ApiRelayer extends BaseApiClient implements IRelayer {
  private jsonRpcRequestNextId: number;

  public constructor(params: ApiRelayerParams) {
    super(params);
    this.jsonRpcRequestNextId = 1;
  }

  protected getPoolId(): string {
    return process.env.DEFENDER_RELAY_POOL_ID || 'us-west-2_iLmIggsiy';
  }

  protected getPoolClientId(): string {
    return process.env.DEFENDER_RELAY_POOL_CLIENT_ID || '1bpd19lcr33qvg5cr3oi79rdap';
  }

  protected getApiUrl(): string {
    return RelayerApiUrl();
  }

  public async getRelayer(): Promise<RelayerModel> {
    return this.apiCall(async (api) => {
      return (await api.get('/relayer')) as RelayerModel;
    });
  }

  public async sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.post('/txs', payload)) as RelayerTransaction;
    });
  }

  public async sign(payload: SignMessagePayload): Promise<SignedMessagePayload> {
    return this.apiCall(async (api) => {
      return (await api.post('/sign', payload)) as SignedMessagePayload;
    });
  }

  public async query(id: string): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.get(`txs/${id}`)) as RelayerTransaction;
    });
  }

  public async list(criteria?: ListTransactionsRequest): Promise<RelayerTransaction[]> {
    return this.apiCall(async (api) => {
      return (await api.get(`txs`, { params: criteria ?? {} })) as RelayerTransaction[];
    });
  }

  public async call(method: string, params: string[]): Promise<JsonRpcResponse> {
    return this.apiCall(async (api) => {
      return (await api.post(`/relayer/jsonrpc`, {
        method,
        params,
        jsonrpc: '2.0',
        id: this.jsonRpcRequestNextId++,
      })) as JsonRpcResponse;
    });
  }
}

import { BaseApiClient, ApiVersion } from '@openzeppelin/defender-base-client';
import {
  ApiRelayerParams,
  IRelayer,
  JsonRpcResponse,
  ListTransactionsRequest,
  RelayerGetResponse,
  RelayerTransaction,
  RelayerTransactionPayload,
  SignedMessagePayload,
  SignTypedDataPayload,
  SignMessagePayload,
  CreateRelayerRequest,
  RelayerListResponse,
  UpdateRelayerPoliciesRequest,
  UpdateRelayerRequest,
  RelayerApiKey,
  DeleteRelayerApiKeyResponse,
  PaginatedTransactionListResponse,
  RelayerStatus,
} from '../relayer';

export const RelaySignerApiUrl = () =>
  process.env.DEFENDER_RELAY_SIGNER_API_URL || 'https://api.defender.openzeppelin.com/';

export class RelayClient extends BaseApiClient {
  protected getPoolId(): string {
    return process.env.DEFENDER_RELAY_POOL_ID || 'us-west-2_94f3puJWv';
  }

  protected getPoolClientId(): string {
    return process.env.DEFENDER_RELAY_POOL_CLIENT_ID || '40e58hbc7pktmnp9i26hh5nsav';
  }

  protected getApiUrl(v: ApiVersion = 'v1'): string {
    if (v === 'v2') {
      return process.env.DEFENDER_API_V2_URL || 'https://defender-api.openzeppelin.com/v2/';
    }
    return process.env.DEFENDER_RELAY_API_URL || 'https://defender-api.openzeppelin.com/relayer/';
  }

  public async get(relayerId: string): Promise<RelayerGetResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/relayers/${relayerId}`);
    });
  }

  public async list(): Promise<RelayerListResponse> {
    return this.apiCall(async (api) => {
      return await api.get('/relayers/summary');
    });
  }

  public async create(relayer: CreateRelayerRequest): Promise<RelayerGetResponse> {
    return this.apiCall(async (api) => {
      return await api.post('/relayers', relayer);
    });
  }

  public async update(relayerId: string, relayerUpdateParams: UpdateRelayerRequest): Promise<RelayerGetResponse> {
    const currentRelayer = await this.get(relayerId);

    if (relayerUpdateParams.policies) {
      const updatedRelayer = await this.updatePolicies(relayerId, {
        ...currentRelayer.policies,
        ...relayerUpdateParams.policies,
      });
      // if policies are the only update, return
      if (Object.keys(relayerUpdateParams).length === 1) return updatedRelayer;
    }

    return this.apiCall(async (api) => {
      return await api.put(`/relayers`, {
        ...currentRelayer,
        ...relayerUpdateParams,
      });
    });
  }

  private async updatePolicies(
    relayerId: string,
    relayerPolicies: UpdateRelayerPoliciesRequest,
  ): Promise<RelayerGetResponse> {
    return this.apiCall(async (api) => {
      return await api.put(`/relayers/${relayerId}`, relayerPolicies);
    });
  }

  public async createKey(relayerId: string, stackResourceId?: string): Promise<RelayerApiKey> {
    return this.apiCall(async (api) => {
      return await api.post(`/relayers/${relayerId}/keys`, { stackResourceId });
    });
  }

  public async listKeys(relayerId: string): Promise<RelayerApiKey[]> {
    return this.apiCall(async (api) => {
      return await api.get(`/relayers/${relayerId}/keys`);
    });
  }

  public async deleteKey(relayerId: string, keyId: string): Promise<DeleteRelayerApiKeyResponse> {
    return this.apiCall(async (api) => {
      return await api.delete(`/relayers/${relayerId}/keys/${keyId}`);
    });
  }
}

export class ApiRelayer extends BaseApiClient implements IRelayer {
  private jsonRpcRequestNextId: number;

  public constructor(params: ApiRelayerParams) {
    super(params);
    this.jsonRpcRequestNextId = 1;
  }

  protected getPoolId(): string {
    return process.env.DEFENDER_RELAY_SIGNER_POOL_ID || 'us-west-2_iLmIggsiy';
  }

  protected getPoolClientId(): string {
    return process.env.DEFENDER_RELAY_SIGNER_POOL_CLIENT_ID || '1bpd19lcr33qvg5cr3oi79rdap';
  }

  protected getApiUrl(_: ApiVersion): string {
    return RelaySignerApiUrl();
  }

  public async getRelayer(): Promise<RelayerGetResponse> {
    return this.apiCall(async (api) => {
      return (await api.get('/relayer')) as RelayerGetResponse;
    });
  }

  public async getRelayerStatus(): Promise<RelayerStatus> {
    return this.apiCall(async (api) => {
      return (await api.get('/relayer/status')) as RelayerStatus;
    });
  }

  public async sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.post('/txs', payload)) as RelayerTransaction;
    });
  }

  public async replaceTransactionById(id: string, payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.put(`/txs/${id}`, payload)) as RelayerTransaction;
    });
  }

  public async replaceTransactionByNonce(
    nonce: number,
    payload: RelayerTransactionPayload,
  ): Promise<RelayerTransaction> {
    return this.apiCall(async (api) => {
      return (await api.put(`/txs/${nonce}`, payload)) as RelayerTransaction;
    });
  }

  public async signTypedData(payload: SignTypedDataPayload): Promise<SignedMessagePayload> {
    return this.apiCall(async (api) => {
      return (await api.post('/sign-typed-data', payload)) as SignedMessagePayload;
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

  public async list(
    criteria?: ListTransactionsRequest,
  ): Promise<RelayerTransaction[] | PaginatedTransactionListResponse> {
    return this.apiCall(async (api) => {
      const result = (await api.get(`txs`, { params: criteria ?? {} })) as
        | RelayerTransaction[]
        | PaginatedTransactionListResponse;

      if (criteria?.usePagination) {
        return result as PaginatedTransactionListResponse;
      }
      return result as RelayerTransaction[];
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

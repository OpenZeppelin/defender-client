import { BaseApiClient } from 'defender-base-client';
import {
  RelayerGetResponse,
  RelayerListResponse,
  CreateRelayerRequest,
  UpdateRelayerRequest,
  UpdateRelayerPoliciesRequest,
  RelayerApiKey,
  DeleteRelayerApiKeyResponse,
} from './relayer/types';

export const RelaySignerApiUrl = () =>
  process.env.DEFENDER_RELAY_SIGNER_API_URL || 'https://api.defender.openzeppelin.com/';

export class RelayClient extends BaseApiClient {
  protected getPoolId(): string {
    return process.env.DEFENDER_RELAY_POOL_ID || 'us-west-2_94f3puJWv';
  }

  protected getPoolClientId(): string {
    return process.env.DEFENDER_RELAY_POOL_CLIENT_ID || '40e58hbc7pktmnp9i26hh5nsav';
  }

  protected getApiUrl(): string {
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

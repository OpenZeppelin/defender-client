import { PlatformApiClient } from './platform';
import { BlockExplorerApiKeyResponse, CreateBlockExplorerApiKeyRequest, RemoveResponse } from '../models';

export class BlockExplorerApiKeyClient extends PlatformApiClient {
  public async get(blockExplorerApiKeyId: string): Promise<BlockExplorerApiKeyResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/block-explorer-api-key/${blockExplorerApiKeyId}`);
    });
  }
  public async list(): Promise<BlockExplorerApiKeyResponse[]> {
    return this.apiCall(async (api) => {
      return await api.get(`/block-explorer-api-key`);
    });
  }

  public async create(payload: CreateBlockExplorerApiKeyRequest): Promise<BlockExplorerApiKeyResponse> {
    return this.apiCall(async (api) => {
      return await api.post(`/block-explorer-api-key`, payload);
    });
  }

  public async update(
    blockExplorerApiKeyId: string,
    payload: CreateBlockExplorerApiKeyRequest,
  ): Promise<BlockExplorerApiKeyResponse> {
    return this.apiCall(async (api) => {
      return await api.put(`/block-explorer-api-key/${blockExplorerApiKeyId}`, payload);
    });
  }

  public async remove(blockExplorerApiKeyId: string): Promise<RemoveResponse> {
    return this.apiCall(async (api) => {
      return await api.delete(`/block-explorer-api-key/${blockExplorerApiKeyId}`);
    });
  }
}

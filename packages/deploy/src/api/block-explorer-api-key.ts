import { PlatformApiClient } from './platform';
import {
  BlockExplorerApiKeyResponse,
  CreateBlockExplorerApiKeyRequest,
  RemoveResponse,
  UpdateBlockExplorerApiKeyRequest,
} from '../models';

const PATH = '/block-explorer-api-key';

export class BlockExplorerApiKeyClient extends PlatformApiClient {
  public async get(blockExplorerApiKeyId: string): Promise<BlockExplorerApiKeyResponse> {
    return this.apiCall(async (api) => {
      return api.get(`${PATH}/${blockExplorerApiKeyId}`);
    });
  }
  public async list(): Promise<BlockExplorerApiKeyResponse[]> {
    return this.apiCall(async (api) => {
      return api.get(`${PATH}`);
    });
  }

  public async create(payload: CreateBlockExplorerApiKeyRequest): Promise<BlockExplorerApiKeyResponse> {
    return this.apiCall(async (api) => {
      return api.post(`${PATH}`, payload);
    });
  }

  public async update(
    blockExplorerApiKeyId: string,
    payload: UpdateBlockExplorerApiKeyRequest,
  ): Promise<BlockExplorerApiKeyResponse> {
    return this.apiCall(async (api) => {
      return api.put(`${PATH}/${blockExplorerApiKeyId}`, payload);
    });
  }

  public async remove(blockExplorerApiKeyId: string): Promise<RemoveResponse> {
    return this.apiCall(async (api) => {
      return api.delete(`${PATH}/${blockExplorerApiKeyId}`);
    });
  }
}

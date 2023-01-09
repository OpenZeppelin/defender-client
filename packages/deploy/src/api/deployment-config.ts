import { PlatformApiClient } from './platform';
import { DeploymentConfigCreateRequest, DeploymentConfigResponse, RemoveResponse } from '../models';

export class DeploymentConfigClient extends PlatformApiClient {
  public async get(deploymentConfigId: string): Promise<DeploymentConfigResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/deployment-config/${deploymentConfigId}`);
    });
  }
  public async list(): Promise<DeploymentConfigResponse[]> {
    return this.apiCall(async (api) => {
      return await api.get(`/deployment-config`);
    });
  }

  public async create(payload: DeploymentConfigCreateRequest): Promise<DeploymentConfigResponse> {
    return this.apiCall(async (api) => {
      return await api.post(`/deployment-config`, payload);
    });
  }

  public async update(
    deploymentConfigId: string,
    payload: DeploymentConfigCreateRequest,
  ): Promise<DeploymentConfigResponse> {
    return this.apiCall(async (api) => {
      return await api.put(`/deployment-config/${deploymentConfigId}`, payload);
    });
  }

  public async remove(deploymentConfigId: string): Promise<RemoveResponse> {
    return this.apiCall(async (api) => {
      return await api.delete(`/deployment-config/${deploymentConfigId}`);
    });
  }
}

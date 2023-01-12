import { PlatformApiClient } from './platform';
import { DeploymentConfigCreateRequest, DeploymentConfigResponse, RemoveResponse } from '../models';

const PATH = '/deployment-config';

export class DeploymentConfigClient extends PlatformApiClient {
  public async get(deploymentConfigId: string): Promise<DeploymentConfigResponse> {
    return this.apiCall(async (api) => {
      return api.get(`${PATH}/${deploymentConfigId}`);
    });
  }
  public async list(): Promise<DeploymentConfigResponse[]> {
    return this.apiCall(async (api) => {
      return api.get(`${PATH}`);
    });
  }

  public async create(payload: DeploymentConfigCreateRequest): Promise<DeploymentConfigResponse> {
    return this.apiCall(async (api) => {
      return api.post(`${PATH}`, payload);
    });
  }

  public async update(
    deploymentConfigId: string,
    payload: DeploymentConfigCreateRequest,
  ): Promise<DeploymentConfigResponse> {
    return this.apiCall(async (api) => {
      return api.put(`${PATH}/${deploymentConfigId}`, payload);
    });
  }

  public async remove(deploymentConfigId: string): Promise<RemoveResponse> {
    return this.apiCall(async (api) => {
      return api.delete(`${PATH}/${deploymentConfigId}`);
    });
  }
}

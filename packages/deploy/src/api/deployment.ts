import { isEmpty } from 'lodash';
import { PlatformApiClient } from './platform';
import { DeployContractRequest, DeploymentResponse } from '../models';

export class DeploymentClient extends PlatformApiClient {
  public async deploy(payload: DeployContractRequest): Promise<DeploymentResponse> {
    if (isEmpty(payload.artifactUri) && isEmpty(payload.artifactPayload))
      throw new Error(
        `Missing artifact in deploy request. Either artifactPayload or artifactUri must be included in the request.`,
      );
    return this.apiCall(async (api) => {
      return await api.post(`/deployments`, payload);
    });
  }

  public async get(deploymentId: string): Promise<DeploymentResponse> {
    return this.apiCall(async (api) => {
      return await api.get(`/deployments/${deploymentId}`);
    });
  }

  public async list(): Promise<DeploymentResponse[]> {
    return this.apiCall(async (api) => {
      return await api.get(`/deployments`);
    });
  }
}

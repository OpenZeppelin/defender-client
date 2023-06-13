import { isEmpty } from 'lodash';
import { Network } from '@openzeppelin/defender-base-client';
import { PlatformApiClient } from './platform';
import { ApprovalProcessResponse, DeployContractRequest, DeploymentResponse } from '../models';

const PATH = '/deployments';

export class DeploymentClient extends PlatformApiClient {
  public async getApprovalProcess(network: Network): Promise<ApprovalProcessResponse> {
    return this.apiCall(async (api) => {
      return api.get(`${PATH}/config/${network}`);
    });
  }

  public async deploy(payload: DeployContractRequest): Promise<DeploymentResponse> {
    if (isEmpty(payload.artifactUri) && isEmpty(payload.artifactPayload))
      throw new Error(
        `Missing artifact in deploy request. Either artifactPayload or artifactUri must be included in the request.`,
      );
    return this.apiCall(async (api) => {
      return api.post(`${PATH}`, payload);
    });
  }

  public async get(deploymentId: string): Promise<DeploymentResponse> {
    return this.apiCall(async (api) => {
      return api.get(`${PATH}/${deploymentId}`);
    });
  }

  public async list(): Promise<DeploymentResponse[]> {
    return this.apiCall(async (api) => {
      return api.get(`${PATH}`);
    });
  }
}

import { Network } from 'defender-base-client';

import { PlatformApiClient } from './platform';
import { UpgradeApprovalProcessConfig, UpgradeContractRequest, UpgradeContractResponse } from '../models';

const PATH = '/upgrades';

export class UpgradeClient extends PlatformApiClient {
  public async getApprovalProcess(network: Network): Promise<UpgradeApprovalProcessConfig> {
    return this.apiCall(async (api) => {
      return api.get(`${PATH}/config/${network}`);
    });
  }
  public async upgrade(payload: UpgradeContractRequest): Promise<UpgradeContractResponse> {
    return this.apiCall(async (api) => {
      return api.post(`${PATH}`, payload);
    });
  }
}

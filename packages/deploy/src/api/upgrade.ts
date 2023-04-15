import { PlatformApiClient } from './platform';
import { UpgradeContractRequest, UpgradeContractResponse } from '../models';

const PATH = '/upgrades';

export class UpgradeClient extends PlatformApiClient {
  public async upgrade(payload: UpgradeContractRequest): Promise<UpgradeContractResponse> {
    return this.apiCall(async (api) => {
      return api.post(`${PATH}`, payload);
    });
  }
}

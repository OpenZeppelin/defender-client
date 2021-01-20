import { BaseApiClient } from 'defender-base-client';
import { ExternalApiCreateProposalRequest as CreateProposalRequest } from './models/proposal';
import { ExternalApiProposalResponse as ProposalResponse } from './models/response';

type UpgradeParams = {
  title?: string;
  description?: string;
  newImplementation: string;
};

export class AdminClient extends BaseApiClient {
  protected getPoolId(): string {
    return process.env.DEFENDER_ADMIN_POOL_ID || 'us-west-2_94f3puJWv';
  }

  protected getPoolClientId(): string {
    return process.env.DEFENDER_ADMIN_POOL_CLIENT_ID || '40e58hbc7pktmnp9i26hh5nsav';
  }

  protected getApiUrl(): string {
    return process.env.DEFENDER_ADMIN_API_URL || 'https://defender-api.openzeppelin.com/admin/';
  }

  public async createProposal(proposal: CreateProposalRequest): Promise<ProposalResponse> {
    return this.apiCall(async (api) => {
      return (await api.post('/proposals', proposal)) as ProposalResponse;
    });
  }

  public async proposeUpgrade(
    params: UpgradeParams,
    contract: CreateProposalRequest['contract'],
  ): Promise<ProposalResponse> {
    const request: CreateProposalRequest = {
      contract,
      type: 'upgrade',
      metadata: {
        newImplementationAddress: params.newImplementation,
      },
      title: params.title ?? `Upgrade to ${params.newImplementation.slice(0, 10)}`,
      description: params.description ?? `Upgrade contract implementation to ${params.newImplementation}`,
    };
    return this.createProposal(request);
  }
}

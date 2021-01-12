import { BaseApiClient } from '../../base/lib';
import { ExternalApiCreateProposalRequest as CreateProposalRequest } from './models/proposal';
import { ExternalApiProposalResponse as ProposalResponse } from './models/response';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not set`);
  return value;
}

type UpgradeParams = {
  title?: string;
  description?: string;
  newImplementation: string;
};

export class AdminClient extends BaseApiClient {
  protected getPoolId(): string {
    return getEnv('DEFENDER_ADMIN_POOL_ID');
  }

  protected getPoolClientId(): string {
    return getEnv('DEFENDER_ADMIN_POOL_CLIENT_ID');
  }

  protected getApiUrl(): string {
    return getEnv('DEFENDER_ADMIN_API_URL');
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

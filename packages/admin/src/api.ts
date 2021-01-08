import { BaseApiClient } from '../../base/lib';
import { ExternalApiCreateProposalRequest as CreateProposalRequest } from './models/proposal';
import { ExternalApiProposalResponse as ProposalResponse } from './models/response';

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not set`);
  return value;
}

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
}

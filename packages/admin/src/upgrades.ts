import { AdminClient } from './api';
import { ExternalApiCreateProposalRequest } from './models/proposal';
import { ExternalApiProposalResponse as ProposalResponse } from './models/response';

export type UpgradeParams = {
  title?: string;
  description?: string;
  newImplementation: string;
};

export class UpgradesClient {
  private client: AdminClient;

  constructor(params: { apiKey: string; apiSecret: string }) {
    this.client = new AdminClient(params);
  }

  public async proposeUpgrade(
    params: UpgradeParams,
    contract: ExternalApiCreateProposalRequest['contract'],
  ): Promise<ProposalResponse> {
    const request: ExternalApiCreateProposalRequest = {
      contract,
      type: 'upgrade',
      metadata: {
        newImplementationAddress: params.newImplementation,
      },
      title: params.title ?? `Upgrade to ${params.newImplementation.slice(0, 10)}`,
      description: params.description ?? `Upgrade contract implementation to ${params.newImplementation}`,
    };
    return this.client.createProposal(request);
  }
}

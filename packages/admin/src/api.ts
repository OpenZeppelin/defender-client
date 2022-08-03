import { BaseApiClient } from 'defender-base-client';
import { capitalize } from 'lodash';
import { Address, ExternalApiCreateProposalRequest as CreateProposalRequest } from './models/proposal';
import { Contract } from './models/contract';
import { ExternalApiProposalResponse as ProposalResponse } from './models/response';
import { getProposalUrl } from './utils';

type UpgradeParams = {
  title?: string;
  description?: string;
  proxyAdmin?: string;
  via?: Address;
  viaType?: 'EOA' | 'Gnosis Safe' | 'Gnosis Multisig';
  newImplementation: string;
  newImplementationAbi: string;
};

type PauseParams = {
  title?: string;
  description?: string;
  via: Address;
  viaType: 'EOA' | 'Gnosis Safe' | 'Gnosis Multisig';
};

export interface ProposalResponseWithUrl extends ProposalResponse {
  url: string;
}

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

  public async addContract(contract: Contract): Promise<Contract> {
    return this.apiCall(async (api) => {
      return (await api.put('/contracts', contract)) as Contract;
    });
  }

  public async listContracts(): Promise<Omit<Contract, 'abi'>[]> {
    return this.apiCall(async (api) => {
      return (await api.get('/contracts')) as Omit<Contract, 'abi'>[];
    });
  }

  public async createProposal(proposal: CreateProposalRequest): Promise<ProposalResponseWithUrl> {
    return this.apiCall(async (api) => {
      const response = (await api.post('/proposals', proposal)) as ProposalResponse;
      return { ...response, url: getProposalUrl(response) };
    });
  }

  public async listProposals(): Promise<ProposalResponseWithUrl[]> {
    return this.apiCall(async (api) => {
      const response = (await api.get('/proposals')) as ProposalResponse[];
      return response.map((proposal) => ({ ...proposal, url: getProposalUrl(proposal) }));
    });
  }

  public async proposeUpgrade(
    params: UpgradeParams,
    contract: CreateProposalRequest['contract'],
  ): Promise<ProposalResponseWithUrl> {
    const request: CreateProposalRequest = {
      contract,
      type: 'upgrade',
      metadata: {
        newImplementationAddress: params.newImplementation,
        newImplementationAbi: params.newImplementationAbi,
        proxyAdminAddress: params.proxyAdmin,
      },
      title: params.title ?? `Upgrade to ${params.newImplementation.slice(0, 10)}`,
      description: params.description ?? `Upgrade contract implementation to ${params.newImplementation}`,
      via: params.via,
      viaType: params.viaType,
    };
    return this.createProposal(request);
  }

  public async proposePause(
    params: PauseParams,
    contract: CreateProposalRequest['contract'],
  ): Promise<ProposalResponseWithUrl> {
    return this.proposePauseabilityAction(params, contract, 'pause');
  }

  public async proposeUnpause(
    params: PauseParams,
    contract: CreateProposalRequest['contract'],
  ): Promise<ProposalResponseWithUrl> {
    return this.proposePauseabilityAction(params, contract, 'unpause');
  }

  private async proposePauseabilityAction(
    params: PauseParams,
    contract: CreateProposalRequest['contract'],
    action: 'pause' | 'unpause',
  ): Promise<ProposalResponseWithUrl> {
    const request: CreateProposalRequest = {
      contract,
      type: 'pause',
      via: params.via,
      viaType: params.viaType,
      functionInputs: [],
      functionInterface: { name: action, inputs: [] },
      metadata: {
        action,
      },
      title: params.title ?? `${capitalize(action)} contract`,
      description: params.description ?? `${capitalize(action)} contract`,
    };
    return this.createProposal(request);
  }
}

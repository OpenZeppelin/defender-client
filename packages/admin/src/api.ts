import { BaseApiClient } from 'defender-base-client';
import { capitalize, isEmpty } from 'lodash';
import { Hex, Address, ExternalApiCreateProposalRequest as CreateProposalRequest } from './models/proposal';
import { Contract } from './models/contract';
import { ExternalApiProposalResponse as ProposalResponse } from './models/response';
import { getProposalUrl } from './utils';
import { Verification, VerificationRequest } from './models/verification';

type UpgradeParams = {
  title?: string;
  description?: string;
  proxyAdmin?: string;
  via?: Address;
  viaType?: CreateProposalRequest['viaType'];
  newImplementation: string;
  newImplementationAbi?: string;
};

type PauseParams = {
  title?: string;
  description?: string;
  via: Address;
  viaType: CreateProposalRequest['viaType'];
};

type AccessControlParams = {
  title?: string;
  description?: string;
  via: Address;
  viaType: CreateProposalRequest['viaType'];
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

  public async deleteContract(contractId: string): Promise<string> {
    return this.apiCall(async (api) => {
      return (await api.delete(`/contracts/${contractId}`)) as string;
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

  public async listProposals(opts: { includeArchived?: boolean } = {}): Promise<ProposalResponseWithUrl[]> {
    return this.apiCall(async (api) => {
      const response = (await api.get('/proposals', { params: opts })) as ProposalResponse[];
      return response.map((proposal) => ({ ...proposal, url: getProposalUrl(proposal) }));
    });
  }

  public async archiveProposal(contractId: string, proposalId: string): Promise<ProposalResponseWithUrl> {
    return this.apiCall(async (api) => {
      const response = (await api.put(`/contracts/${contractId}/proposals/${proposalId}/archived`, {
        archived: true,
      })) as ProposalResponse;
      return { ...response, url: getProposalUrl(response) };
    });
  }

  public async unarchiveProposal(contractId: string, proposalId: string): Promise<ProposalResponseWithUrl> {
    return this.apiCall(async (api) => {
      const response = (await api.put(`/contracts/${contractId}/proposals/${proposalId}/archived`, {
        archived: false,
      })) as ProposalResponse;
      return { ...response, url: getProposalUrl(response) };
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

  public async proposeGrantRole(
    params: AccessControlParams,
    contract: CreateProposalRequest['contract'],
    role: Hex,
    account: Address,
  ): Promise<ProposalResponseWithUrl> {
    return this.proposeAccessControlAction(params, contract, 'grantRole', role, account);
  }

  public async proposeRevokeRole(
    params: AccessControlParams,
    contract: CreateProposalRequest['contract'],
    role: Hex,
    account: Address,
  ): Promise<ProposalResponseWithUrl> {
    return this.proposeAccessControlAction(params, contract, 'revokeRole', role, account);
  }

  public async verifyDeployment(params: VerificationRequest): Promise<Verification> {
    if (isEmpty(params.artifactUri) && (isEmpty(params.artifactPayload) || isEmpty(params.referenceUri)))
      throw new Error(
        `Missing artifact in verification request. Either artifactPayload and referenceUri, or artifactUri must be included in the request.`,
      );

    return this.apiCall(async (api) => {
      return (await api.post('/verifications', params)) as Verification;
    });
  }

  public async getDeploymentVerification(
    params: Pick<VerificationRequest, 'contractAddress' | 'contractNetwork'>,
  ): Promise<Verification | undefined> {
    return this.apiCall(async (api) => {
      try {
        return (await api.get(`/verifications/${params.contractNetwork}/${params.contractAddress}`)) as Verification;
      } catch {
        return undefined;
      }
    });
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

  private async proposeAccessControlAction(
    params: AccessControlParams,
    contract: CreateProposalRequest['contract'],
    action: 'grantRole' | 'revokeRole',
    role: Hex,
    account: Address,
  ): Promise<ProposalResponseWithUrl> {
    const request: CreateProposalRequest = {
      contract,
      type: 'access-control',
      via: params.via,
      viaType: params.viaType,
      functionInputs: [role, account],
      functionInterface: {
        name: action,
        inputs: [
          {
            name: 'role',
            type: 'bytes32',
          },
          {
            name: 'account',
            type: 'address',
          },
        ],
      },
      metadata: {
        action,
        role,
        account,
      },
      title: params.title ?? `${capitalize(action)} to ${account}`,
      description: params.description ?? `${capitalize(action)} to ${account}`,
    };
    return this.createProposal(request);
  }
}

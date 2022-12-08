import { BaseApiClient, Network } from 'defender-base-client';
import { capitalize, isArray, isEmpty } from 'lodash';
import { Interface } from 'ethers/lib/utils';

import {
  Hex,
  Address,
  ExternalApiCreateProposalRequest as CreateProposalRequest,
  PartialContract,
} from './models/proposal';
import { SimulationRequest as SimulationTransaction, SimulationResponse } from './models/simulation';
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
  simulation?: SimulationResponse;
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

  // added separate from CreateProposalRequest type as the `simulate` boolean is contained within defender-client
  public async createProposal(
    proposal: CreateProposalRequest & { simulate?: boolean; overrideSimulationOpts?: SimulationTransaction },
  ): Promise<ProposalResponseWithUrl> {
    return this.apiCall(async (api) => {
      let simulation: SimulationResponse | undefined = undefined;
      let simulationData = '0x';
      const isBatchProposal = (contract: PartialContract | PartialContract[]): contract is PartialContract[] =>
        isArray(contract);

      // handle simulation checks before creating proposal
      if (proposal.simulate) {
        // we do not support simulating batch proposals from the client.
        if (isBatchProposal(proposal.contract)) {
          throw new Error(
            'Simulating a batch proposal is currently not supported from the API. Use the Defender UI to manually trigger a simulation.',
          );
        }
        const overrideData = proposal.overrideSimulationOpts?.transactionData.data;
        simulationData = overrideData ?? '0x';
        // only check if we haven't overridden the simulation data property
        if (!overrideData) {
          // Check if ABI is provided so we can encode the function
          if (!proposal.contract.abi) {
            // no ABI found, request user to pass in `data` in overrideSimulationOpts
            throw new Error(
              'Simulation requested without providing ABI. Please provide the contract ABI or use the `overrideSimulationOpts` to provide the data property directly.',
            );
          }
          const contractInterface = new Interface(proposal.contract.abi);

          // this is defensive and should never happen since createProposal schema validation will fail without this property defined.
          if (!proposal.functionInterface) {
            // no function selected, request user to pass in `data` in overrideSimulationOpts
            throw new Error(
              'Simulation requested without providing function interface. Please provide the function interface or use the `overrideSimulationOpts` to provide the data property directly.',
            );
          }
          simulationData = contractInterface.encodeFunctionData(
            proposal.functionInterface.name!,
            proposal.functionInputs,
          );
        }
      }

      // create proposal
      const response = (await api.post('/proposals', proposal)) as ProposalResponse;

      // create simulation
      if (proposal.simulate && !isBatchProposal(proposal.contract)) {
        try {
          simulation = await this.simulateProposal(response.contractId, response.proposalId, {
            transactionData: {
              from: proposal.via,
              to: proposal.contract.address,
              data: simulationData,
              value: proposal.metadata?.sendValue ?? '0',
              ...proposal.overrideSimulationOpts?.transactionData,
            },
            blockNumber: proposal.overrideSimulationOpts?.blockNumber,
          });
        } catch (e) {
          // simply log so we don't block createProposal response
          console.warn('Simulation Failed:', e);
        }
      }
      return { ...response, url: getProposalUrl(response), simulation };
    });
  }

  public async listProposals(opts: { includeArchived?: boolean } = {}): Promise<ProposalResponseWithUrl[]> {
    return this.apiCall(async (api) => {
      const response = (await api.get('/proposals', { params: opts })) as ProposalResponse[];
      return response.map((proposal) => ({ ...proposal, url: getProposalUrl(proposal) }));
    });
  }

  public async getProposal(contractId: string, proposalId: string): Promise<ProposalResponseWithUrl> {
    return this.apiCall(async (api) => {
      const response = (await api.get(`/contracts/${contractId}/proposals/${proposalId}`)) as ProposalResponse;
      return { ...response, url: getProposalUrl(response) };
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

  public async getProposalSimulation(contractId: string, proposalId: string): Promise<SimulationResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.get(
        `/contracts/${contractId}/proposals/${proposalId}/simulation`,
      )) as SimulationResponse;
      return response;
    });
  }

  public async simulateProposal(
    contractId: string,
    proposalId: string,
    transaction: SimulationTransaction,
  ): Promise<SimulationResponse> {
    return this.apiCall(async (api) => {
      const response = (await api.post(
        `/contracts/${contractId}/proposals/${proposalId}/simulate`,
        transaction,
      )) as SimulationResponse;
      return response;
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

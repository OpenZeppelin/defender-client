import { Network } from 'defender-base-client';

// Copied from openzeppelin/defender/models/src/types/proposal-api.req.d.ts
export type Address = string;
export type ProposalType = 'upgrade' | 'custom' | 'pause';
export type ProposalFunctionInputs = (string | boolean | (string | boolean)[])[];

export interface ExternalApiCreateProposalRequest {
  contract: {
    network: Network;
    address: Address;
    name?: string;
    abi?: string;
  };
  title: string;
  description: string;
  type: ProposalType;
  metadata?: ProposalMetadata;
  via?: Address;
  viaType?: 'EOA' | 'Gnosis Safe' | 'Gnosis Multisig';
  functionInterface?: ProposalTargetFunction;
  functionInputs?: ProposalFunctionInputs;
}
export interface ProposalMetadata {
  newImplementationAddress?: Address;
  proxyAdminAddress?: Address;
  action?: 'pause' | 'unpause';
  operationType?: 'call' | 'delegateCall';
}
export interface ProposalTargetFunction {
  name?: string;
  inputs?: ProposalFunctionInputType[];
}
export interface ProposalFunctionInputType {
  name?: string;
  type: string;
  internalType?: string;
  components?: ProposalFunctionInputType[];
}

import { Network } from 'defender-base-client';

// Copied from openzeppelin/defender/models/src/types/proposal-api.req.d.ts
export type Hex = string;
export type Address = string;
export type BigUInt = string | number;
export type ProposalType = ProposalStepType | ProposalBatchType;
export type ProposalStepType = 'upgrade' | 'custom' | 'pause' | 'send-funds' | 'access-control';
export type ProposalBatchType = 'batch';
export type ProposalFunctionInputs = (string | boolean | (string | boolean)[])[];

export interface ExternalApiCreateProposalRequest {
  contract: PartialContract | PartialContract[];
  title: string;
  description: string;
  type: ProposalType;
  metadata?: ProposalMetadata;
  via?: Address;
  viaType?: 'EOA' | 'Gnosis Safe' | 'Gnosis Multisig';
  functionInterface?: ProposalTargetFunction;
  functionInputs?: ProposalFunctionInputs;
  steps?: ProposalStep[];
}

export interface PartialContract {
  network: Network;
  address: Address;
  name?: string;
  abi?: string;
}

export interface ProposalStep {
  contractId: string;
  targetFunction?: ProposalTargetFunction;
  functionInputs?: ProposalFunctionInputs;
  metadata?: ProposalMetadata;
  type: ProposalStepType;
}

export interface ProposalMetadata {
  newImplementationAddress?: Address;
  newImplementationAbi?: string;
  proxyAdminAddress?: Address;
  action?: 'pause' | 'unpause' | 'grantRole' | 'revokeRole';
  operationType?: 'call' | 'delegateCall';
  account?: Address;
  role?: Hex;
  sendTo?: Address;
  sendValue?: BigUInt;
  sendCurrency?: Token | NativeCurrency;
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

export interface Token {
  name: string;
  symbol: string;
  address: Address;
  network: Network;
  decimals: number;
  type: 'ERC20';
}
export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
  type: 'native';
}

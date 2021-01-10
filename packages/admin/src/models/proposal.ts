// Copied from openzeppelin/defender/models/src/types/proposal-api.req.d.ts

export type Network = 'mainnet' | 'ropsten' | 'rinkeby' | 'kovan' | 'goerli' | 'xdai' | 'sokol';
export type Address = string;
export type ProposalType = 'upgrade' | 'custom';
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
  viaType?: 'EOA' | 'Contract' | 'Multisig' | 'Gnosis Safe' | 'Gnosis Multisig' | 'Unknown';
  functionInterface?: ProposalTargetFunction;
  functionInputs?: ProposalFunctionInputs;
}
export interface ProposalMetadata {
  newImplementationAddress: Address;
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

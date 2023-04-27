import { Network } from 'defender-base-client';
import { Address } from '.';

export type EnvironmentType = 'test' | 'production';
export type ApprovalProcessType = 'relayer' | 'multisig' | 'fireblocks';

export interface ApprovalProcessResponse {
  approvalProcessId: string;
  name: string;
  environment: EnvironmentType;
  type: ApprovalProcessType;
  configs: (RelayerConfig | MultisigConfig | FireblocksConfig)[];
  createdAt: string;
  stackResourceId?: string;
}
export interface RelayerConfig {
  network: Network;
  relayerId: string;
}
export interface MultisigConfig {
  network: Network;
  multisig: Address;
}
export interface FireblocksConfig {
  network: Network;
  fireblocks: FireblocksProposalParams;
}
export interface FireblocksProposalParams {
  apiKeyId: string;
  vaultId: string;
  assetId: string;
}

export type UpgradeApprovalProcessConfig = MultisigConfig | FireblocksConfig;
export type DeployApprovalProcessConfig = RelayerConfig;

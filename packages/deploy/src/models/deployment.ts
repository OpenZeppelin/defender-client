import { Network } from '@openzeppelin/defender-base-client';
import { Address } from '.';

export type SourceCodeLicense =
  | 'None'
  | 'Unlicense'
  | 'MIT'
  | 'GNU GPLv2'
  | 'GNU GPLv3'
  | 'GNU LGPLv2.1'
  | 'GNU LGPLv3'
  | 'BSD-2-Clause'
  | 'BSD-3-Clause'
  | 'MPL-2.0'
  | 'OSL-3.0'
  | 'Apache-2.0'
  | 'GNU AGPLv3'
  | 'BSL 1.1';

export interface DeployContractRequest {
  contractName: string;
  contractPath: string;
  network: Network;
  artifactPayload?: string;
  artifactUri?: string;
  value?: string;
  salt?: string;
  verifySourceCode: boolean;
  licenseType?: SourceCodeLicense;
  libraries?: DeployRequestLibraries;
  constructorInputs?: (string | boolean | number)[];
  relayerId?: string;
}
export interface DeployRequestLibraries {
  [k: string]: string;
}

export interface DeploymentResponse {
  deploymentId: string;
  createdAt: string;
  contractName: string;
  contractPath: string;
  network: Network;
  relayerId: string;
  address: Address;
  status: string;
  blockExplorerVerification: BlockExplorerVerification;
  deployDataVerification: string;
  bytecodeVerification: string;
  deploymentArtifactId?: string;
  transactionId: string;
  txHash: string;
  abi: string;
  bytecode: string;
  constructorBytecode: string;
  value: string;
  salt: string;
  licenseType?: SourceCodeLicense;
  libraries?: {
    [k: string]: string;
  };
  constructorInputs?: (string | boolean | number)[];
}
export interface BlockExplorerVerification {
  status: string;
  error?: string;
  etherscanGuid?: string;
}

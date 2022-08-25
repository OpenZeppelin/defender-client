// These types are vendored from the models package
import { Network } from 'defender-base-client';

export type Address = string;

export interface VerificationRequest {
  artifactUri: string;
  solidityFilePath: string;
  contractName: string;
  contractAddress: Address;
  contractNetwork: Network;
}

export type Verification = VerificationRequest & {
  verificationId: string;
  artifactUri: string;
  solidityFilePath: string;
  contractName: string;
  contractAddress: Address;
  contractNetwork: Network;
  onChainSha256: string;
  providedSha256: string;
  lastVerifiedAt: string;
  matchType: 'NO_MATCH' | 'PARTIAL' | 'EXACT';
  providedBy: string;
  providedByType: 'USER_EMAIL' | 'API_KEY'
}

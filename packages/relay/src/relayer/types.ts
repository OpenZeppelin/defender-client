import { Network } from 'defender-base-client';

export type Address = string;
export type BigUInt = string | number;
export type Hex = string;
export type Speed = 'safeLow' | 'average' | 'fast' | 'fastest';
export type Status = 'pending' | 'sent' | 'submitted' | 'inmempool' | 'mined' | 'confirmed' | 'failed';

export interface SendBaseTransactionRequest {
  to?: Address;
  value?: BigUInt;
  data?: Hex;
  gasLimit: BigUInt;
  validUntil?: string;
}

export interface SendSpeedTransactionRequest extends SendBaseTransactionRequest {
  speed: Speed;
}

export interface SendLegacyTransactionRequest extends SendBaseTransactionRequest {
  gasPrice: BigUInt;
}

export interface SendEIP1559TransactionRequest extends SendBaseTransactionRequest {
  maxFeePerGas: BigUInt;
  maxPriorityFeePerGas: BigUInt;
}

export type RelayerTransactionPayload =
  | SendBaseTransactionRequest
  | SendSpeedTransactionRequest
  | SendLegacyTransactionRequest
  | SendEIP1559TransactionRequest;

export interface SignMessagePayload {
  message: Hex;
}

export interface SignTypedDataPayload {
  domainSeparator: Hex;
  hashStructMessage: Hex;
}

export interface SignedMessagePayload {
  sig: Hex;
  r: Hex;
  s: Hex;
  v: number;
}

export interface RelayerGetResponse {
  relayerId: string;
  name: string;
  address: string;
  network: Network;
  paused: boolean;
  createdAt: string;
  pendingTxCost: string;
  minBalance: BigUInt;
  policies: UpdateRelayerPoliciesRequest;
  stackResourceId?: string;
}

// updating reference interface name RelayerGetResponse to match conventions
// maintaining RelayerModel interface name below to prevent breaking TS implementations
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RelayerModel extends RelayerGetResponse {}

export interface RelayerListResponse {
  items: RelayerGetResponse[];
  txsQuotaUsage: number;
}

export interface CreateRelayerRequest {
  name: string;
  useAddressFromRelayerId?: string;
  network: Network;
  minBalance: BigUInt;
  policies?: UpdateRelayerPoliciesRequest;
  stackResourceId?: string;
}

export interface UpdateRelayerPoliciesRequest {
  gasPriceCap?: BigUInt;
  whitelistReceivers?: Address[];
  EIP1559Pricing?: boolean;
}

export interface UpdateRelayerRequest {
  name?: string;
  policies?: UpdateRelayerPoliciesRequest;
  minBalance?: BigUInt;
}

export interface RelayerApiKey {
  keyId: string;
  relayerId: string;
  secretKey?: string;
  apiKey: string;
  createdAt: string;
  stackResourceId?: string;
}

export interface DeleteRelayerApiKeyResponse {
  message: string;
}

// from openzeppelin/defender/models/src/types/tx.res.ts
interface RelayerTransactionBase {
  transactionId: string;
  hash: string;
  to: Address;
  from: Address;
  value?: string;
  data?: string;
  speed: Speed;
  gasLimit: number;
  nonce: number;
  status: Status;
  chainId: number;
  validUntil: string;
}

interface RelayerLegacyTransaction extends RelayerTransactionBase {
  gasPrice: number;
}

interface RelayerEIP1559Transaction extends RelayerTransactionBase {
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
}

export type RelayerTransaction = RelayerLegacyTransaction | RelayerEIP1559Transaction;

export type RelayerParams = { apiKey: string; apiSecret: string };

export type JsonRpcResponse = {
  id: number | null;
  jsonrpc: '2.0';
  result: any;
  error?: {
    code: number;
    message: string;
    data?: string;
  };
};

export type JsonRpcRequest = {
  id: number;
  jsonrpc: '2.0';
  method: string;
  params: string[];
};

// Copied from defender/models/src/types/tx-list.req.d.ts
export type ListTransactionsRequest = {
  status?: 'pending' | 'mined' | 'failed';
  since?: Date;
  limit?: number;
};

import { Network } from '@openzeppelin/defender-base-client';
import https from 'https';
import { ApiRelayer } from './api';
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
  isPrivate?: boolean;
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
  privateTransactions?: boolean;
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
  speed?: Speed;
  gasLimit: number;
  nonce: number;
  status: Status;
  chainId: number;
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  pricedAt?: string;
  isPrivate?: boolean;
}

interface RelayerLegacyTransaction extends RelayerTransactionBase {
  gasPrice: number;
}

interface RelayerEIP1559Transaction extends RelayerTransactionBase {
  maxPriorityFeePerGas: number;
  maxFeePerGas: number;
}

export type RelayerTransaction = RelayerLegacyTransaction | RelayerEIP1559Transaction;
export type PaginatedTransactionListResponse = RelayerTransaction[] | { items: RelayerTransaction[]; next?: string };

export type RelayerParams = ApiRelayerParams | AutotaskRelayerParams;
export type ApiRelayerParams = { apiKey: string; apiSecret: string; httpsAgent?: https.Agent };
export type AutotaskRelayerParams = { credentials: string; relayerARN: string; httpsAgent?: https.Agent };

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

function isAutotaskCredentials(
  credentials: AutotaskRelayerParams | ApiRelayerParams,
): credentials is AutotaskRelayerParams {
  const autotaskCredentials = credentials as AutotaskRelayerParams;
  return !!autotaskCredentials.credentials;
}

function isApiCredentials(credentials: AutotaskRelayerParams | ApiRelayerParams): credentials is ApiRelayerParams {
  const apiCredentials = credentials as ApiRelayerParams;
  return !!apiCredentials.apiKey && !!apiCredentials.apiSecret;
}

// If a tx-like object is representing a legacy transaction (type 0)
export function isLegacyTx<TransactionLikeType extends object>(
  tx: TransactionLikeType,
): tx is TransactionLikeType & { gasPrice: NonNullable<unknown> } {
  // Consider that an EIP1559 tx may have `gasPrice` after
  // https://github.com/OpenZeppelin/defender/pull/2838
  // that's why the !isEIP1559Tx check
  return 'gasPrice' in tx && !isEIP1559Tx(tx);
}

// If a tx-like object is representing a EIP1559 transaction (type 2)
export function isEIP1559Tx<TransactionLikeType extends object>(
  tx: TransactionLikeType,
): tx is TransactionLikeType & {
  maxPriorityFeePerGas: NonNullable<unknown>;
  maxFeePerGas: NonNullable<unknown>;
} {
  return 'maxPriorityFeePerGas' in tx && 'maxFeePerGas' in tx;
}

function validatePayload(payload: RelayerTransactionPayload) {
  if (
    isEIP1559Tx(payload) &&
    BigInt(payload.maxFeePerGas as BigUInt) < BigInt(payload.maxPriorityFeePerGas as BigUInt)
  ) {
    throw new Error('maxFeePerGas should be greater or equal to maxPriorityFeePerGas');
  }
  if (payload.validUntil && new Date(payload.validUntil).getTime() < new Date().getTime()) {
    throw new Error('The validUntil time cannot be in the past');
  }
  if (!payload.to && !payload.data) {
    throw new Error('Both txs `to` and `data` fields are missing. At least one of them has to be set.');
  }
  return payload;
}

// Copied from defender/models/src/types/tx-list.req.d.ts
export type ListTransactionsRequest = {
  status?: 'pending' | 'mined' | 'failed';
  since?: Date;
  limit?: number;
  next?: string;
  sort?: 'asc' | 'desc';
  usePagination?: boolean;
};

export interface IRelayer {
  getRelayer(): Promise<RelayerGetResponse>;
  sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction>;
  replaceTransactionById(id: string, payload: RelayerTransactionPayload): Promise<RelayerTransaction>;
  replaceTransactionByNonce(nonce: number, payload: RelayerTransactionPayload): Promise<RelayerTransaction>;
  query(id: string): Promise<RelayerTransaction>;
  list(criteria?: ListTransactionsRequest): Promise<RelayerTransaction[] | PaginatedTransactionListResponse>;
  sign(payload: SignMessagePayload): Promise<SignedMessagePayload>;
  signTypedData(payload: SignTypedDataPayload): Promise<SignedMessagePayload>;
  call(method: string, params: string[]): Promise<JsonRpcResponse>;
}

export function isRelayer(params: any): params is Relayer {
  return typeof params === 'object' && !!params.getRelayer;
}

export class Relayer implements IRelayer {
  private relayer: IRelayer;

  public constructor(credentials: RelayerParams) {
    if (isAutotaskCredentials(credentials)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { AutotaskRelayer } = require('./autotask');
      this.relayer = new AutotaskRelayer(credentials);
    } else if (isApiCredentials(credentials)) {
      this.relayer = new ApiRelayer(credentials);
    } else {
      throw new Error(
        `Missing credentials for creating a Relayer instance. If you are running this code in an Autotask, make sure you pass the "credentials" parameter from the handler to the Relayer constructor. If you are running this on your own process, then pass an object with the "apiKey" and "apiSecret" generated by the relayer.`,
      );
    }
  }

  public getRelayer(): Promise<RelayerGetResponse> {
    return this.relayer.getRelayer();
  }

  public sign(payload: SignMessagePayload): Promise<SignedMessagePayload> {
    return this.relayer.sign(payload);
  }

  public signTypedData(payload: SignTypedDataPayload): Promise<SignedMessagePayload> {
    return this.relayer.signTypedData(payload);
  }

  public sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    validatePayload(payload);
    return this.relayer.sendTransaction(payload);
  }

  public replaceTransactionById(id: string, payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    validatePayload(payload);
    return this.relayer.replaceTransactionById(id, payload);
  }

  public replaceTransactionByNonce(nonce: number, payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    validatePayload(payload);
    return this.relayer.replaceTransactionByNonce(nonce, payload);
  }

  public query(id: string): Promise<RelayerTransaction> {
    return this.relayer.query(id);
  }

  public list(criteria?: ListTransactionsRequest): Promise<RelayerTransaction[] | PaginatedTransactionListResponse> {
    return this.relayer.list(criteria);
  }

  public call(method: string, params: string[]): Promise<JsonRpcResponse> {
    return this.relayer.call(method, params);
  }
}

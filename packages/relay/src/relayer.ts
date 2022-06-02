import { ApiRelayer } from './api';
import { Network } from 'defender-base-client';
export type Address = string;
export type BigUInt = string | number;
export type Hex = string;
export type Speed = 'safeLow' | 'average' | 'fast' | 'fastest';
export type Status = 'pending' | 'sent' | 'submitted' | 'inmempool' | 'mined' | 'confirmed' | 'failed';

export type RelayerTransactionPayload = {
  to?: Address;
  value?: BigUInt;
  data?: Hex;
  speed?: Speed;
  gasPrice?: BigUInt;
  gasLimit: BigUInt;
  validUntil?: string;
};

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
}

export interface UpdateRelayerPoliciesRequest {
  gasPriceCap?: BigUInt;
  whitelistReceivers?: Address[];
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
}

export interface DeleteRelayerApiKeyResponse {
  message: string;
}

// from openzeppelin/defender/models/src/types/tx.res.ts
export type RelayerTransaction = {
  transactionId: string;
  hash: string;
  to: Address;
  from: Address;
  value?: string;
  data?: string;
  speed: Speed;
  gasPrice: number;
  gasLimit: number;
  nonce: number;
  status: Status;
  chainId: number;
  validUntil: string;
};

export type RelayerParams = ApiRelayerParams | AutotaskRelayerParams;
export type ApiRelayerParams = { apiKey: string; apiSecret: string };
export type AutotaskRelayerParams = { credentials: string; relayerARN: string };

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

function validatePayload(payload: RelayerTransactionPayload) {
  if (payload.speed && payload.gasPrice) {
    throw new Error("Both tx's speed and gas price are set. Only set one of them.");
  }
  if (payload.validUntil && new Date(payload.validUntil).getTime() < new Date().getTime()) {
    throw new Error('The validUntil time cannot be in the past');
  }
}

// Copied from defender/models/src/types/tx-list.req.d.ts
export type ListTransactionsRequest = {
  status?: 'pending' | 'mined' | 'failed';
  since?: Date;
  limit?: number;
};

export interface IRelayer {
  getRelayer(): Promise<RelayerGetResponse>;
  sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction>;
  replaceTransactionById(id: string, payload: RelayerTransactionPayload): Promise<RelayerTransaction>;
  replaceTransactionByNonce(nonce: number, payload: RelayerTransactionPayload): Promise<RelayerTransaction>;
  query(id: string): Promise<RelayerTransaction>;
  list(criteria?: ListTransactionsRequest): Promise<RelayerTransaction[]>;
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

  public list(criteria?: ListTransactionsRequest): Promise<RelayerTransaction[]> {
    return this.relayer.list(criteria);
  }

  public call(method: string, params: string[]): Promise<JsonRpcResponse> {
    return this.relayer.call(method, params);
  }
}

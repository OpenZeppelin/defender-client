import AWS from 'aws-sdk';
import { authenticate } from './auth';
import { createApi } from './api';
import { AxiosInstance } from 'axios';
import util from 'util';

export type Address = string;
export type BigUInt = string | number;
export type Hex = string;
export type Speed = 'safeLow' | 'average' | 'fast' | 'fastest';
export type Status = 'pending' | 'sent' | 'submitted' | 'inmempool' | 'mined' | 'confirmed';

export type RelayerTransactionPayload = {
  to: Address;
  value?: BigUInt;
  data?: Hex;
  speed?: Speed;
  gasLimit: BigUInt;
};

export interface SignMessagePayload {
  message: Hex;
}

export interface SignedMessagePayload {
  sig: Hex;
  r: Hex;
  s: Hex;
  v: number;
}

// from openzeppelin/defender/models/src/types/tx.res.ts
export type RelayerTransaction = {
  transactionId: string;
  hash: string;
  to: Address;
  from: Address;
  value: string;
  data: string;
  speed: Speed;
  gasPrice: number;
  gasLimit: number;
  nonce: number;
  status: Status;
  chainId: number;
};

export type RelayerParams = ApiRelayerParams | AutotaskRelayerParams;
type ApiRelayerParams = { apiKey: string; apiSecret: string };
type AutotaskRelayerParams = { credentials: string; relayerARN: string };

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

interface IRelayer {
  sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction>;
  query(id: string): Promise<RelayerTransaction>;
  sign(payload: SignMessagePayload): Promise<SignedMessagePayload>;
}

type SendTxPayload = {
  action: 'send-tx';
  payload: RelayerTransactionPayload;
};

type QueryPayload = {
  action: 'get-tx';
  payload: string;
};

type SignPayload = {
  action: 'sign';
  payload: SignMessagePayload;
};

export class AutotaskRelayer implements IRelayer {
  private lambda: AWS.Lambda;
  private relayerARN: string;

  public constructor(params: AutotaskRelayerParams) {
    this.relayerARN = params.relayerARN;
    const creds = JSON.parse(params.credentials);
    this.lambda = new AWS.Lambda({
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken,
      },
    });
  }

  public async sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.execute({ action: 'send-tx', payload });
  }

  public async query(id: string): Promise<RelayerTransaction> {
    return this.execute({
      action: 'get-tx' as const,
      payload: id,
    });
  }

  public async sign(payload: SignMessagePayload): Promise<SignedMessagePayload> {
    return this.execute({
      action: 'sign' as const,
      payload: payload,
    });
  }

  private async execute<T>(payload: SendTxPayload | QueryPayload | SignPayload): Promise<T> {
    const result = await this.lambda
      .invoke({
        FunctionName: this.relayerARN,
        Payload: JSON.stringify(payload),
        InvocationType: 'RequestResponse',
      })
      .promise();
    if (result.FunctionError) {
      throw new Error(`Failed to execute with payload ${util.inspect(payload)}: ${result.FunctionError}`);
    }
    return JSON.parse(result.Payload as string) as T;
  }
}

export class ApiRelayer implements IRelayer {
  private token!: string;
  private api!: AxiosInstance;
  private initialization: Promise<void>;
  private apiKey: string;
  private apiSecret: string;

  public constructor(params: ApiRelayerParams) {
    if (!params.apiSecret) throw new Error(`API key is required`);
    if (!params.apiSecret) throw new Error(`API secret is required`);
    this.apiKey = params.apiKey;
    this.apiSecret = params.apiSecret;
    this.initialization = this.init();
  }

  private async init(): Promise<void> {
    this.token = await authenticate({
      Username: this.apiKey,
      Password: this.apiSecret,
    });
    this.api = createApi(this.apiKey, this.token);
  }

  public async sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    await this.initialization;
    return (await this.api.post('/txs', payload)) as RelayerTransaction;
  }

  public async sign(payload: SignMessagePayload): Promise<SignedMessagePayload> {
    await this.initialization;
    return (await this.api.post('/sign', payload)) as SignedMessagePayload;
  }

  public async query(id: string): Promise<RelayerTransaction> {
    await this.initialization;
    return (await this.api.get(`txs/${id}`)) as RelayerTransaction;
  }
}

export class Relayer implements IRelayer {
  private relayer: IRelayer;

  public constructor(credentials: RelayerParams) {
    if (isAutotaskCredentials(credentials)) {
      this.relayer = new AutotaskRelayer(credentials);
    } else if (isApiCredentials(credentials)) {
      this.relayer = new ApiRelayer(credentials);
    } else {
      throw new Error(`Missing params`);
    }
  }

  sign(payload: SignMessagePayload): Promise<SignedMessagePayload> {
    return this.relayer.sign(payload);
  }

  public sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.relayer.sendTransaction(payload);
  }

  public query(id: string): Promise<RelayerTransaction> {
    return this.relayer.query(id);
  }
}

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

type Credentials = ApiCredentials | AutotaskCredentials;
type ApiCredentials = { apiKey: string; apiSecret: string };
type AutotaskCredentials = { credentials: string; relayerARN: string };

function isAutotaskCredentials(credentials: AutotaskCredentials | ApiCredentials): credentials is AutotaskCredentials {
  const autotaskCredentials = credentials as AutotaskCredentials;
  return !!autotaskCredentials.credentials;
}

function isApiCredentials(credentials: AutotaskCredentials | ApiCredentials): credentials is ApiCredentials {
  const apiCredentials = credentials as ApiCredentials;
  return !!apiCredentials.apiKey && !!apiCredentials.apiSecret;
}

interface IRelayer {
  sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction>;
  query(id: string): Promise<RelayerTransaction>;
}

type SendTxPayload = {
  action: 'send-tx';
  payload: RelayerTransactionPayload;
};

type QueryPayload = {
  action: 'get-tx';
  payload: string;
};

export class AutotaskRelayer implements IRelayer {
  private lambda: AWS.Lambda;
  private relayerARN: string;

  public constructor(credentials: AutotaskCredentials) {
    this.relayerARN = credentials.relayerARN;
    const creds = JSON.parse(credentials.credentials);
    this.lambda = new AWS.Lambda({
      // credentials: {
      //   accessKeyId: creds.AccessKeyId,
      //   secretAccessKey: creds.SecretAccessKey,
      //   sessionToken: creds.SessionToken,
      // },
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

  private async execute<T>(payload: SendTxPayload | QueryPayload): Promise<T> {
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

  public constructor(credentials: ApiCredentials) {
    if (!credentials.apiSecret) throw new Error(`API key is required`);
    if (!credentials.apiSecret) throw new Error(`API secret is required`);
    this.apiKey = credentials.apiKey;
    this.apiSecret = credentials.apiSecret;
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

  public async query(id: string): Promise<RelayerTransaction> {
    await this.initialization;
    return (await this.api.get(`txs/${id}`)) as RelayerTransaction;
  }
}

export class Relayer implements IRelayer {
  private relayer: IRelayer;

  public constructor(credentials: Credentials) {
    if (isAutotaskCredentials(credentials)) {
      this.relayer = new AutotaskRelayer(credentials);
    } else if (isApiCredentials(credentials)) {
      this.relayer = new ApiRelayer(credentials);
    } else {
      throw new Error(`Missing credentials`);
    }
  }

  public sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.relayer.sendTransaction(payload);
  }

  public query(id: string): Promise<RelayerTransaction> {
    return this.relayer.query(id);
  }
}

async function main() {
  const relayerARN =
    'arn:aws:lambda:us-east-1:598931145132:function:ylv-moscow-dev-proxy-relayer:DEFAULT_TENANT_8091ada2-32a0-4ccb-969b-811fd368506e';
  const relayer = new AutotaskRelayer({ credentials: '{}', relayerARN });
  const txRes = await relayer.sendTransaction({
    to: '0xc7dd3ff5b387db0130854fe5f141a78586f417c6',
    value: 100,
    speed: 'fast',
    gasLimit: '1000000',
  });

  console.log(txRes);
  console.log(await relayer.query(txRes.transactionId));
  // console.log(await relayer.query((undefined as unknown) as string));
  // console.log(await relayer.query('512f4db2-5277-4b75-98a0-87089d78be63'));
}

if (require.main === module) {
  main()
    .then(console.log)
    .catch((err) => console.error(`ERROR!`, err));
}

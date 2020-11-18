import AWS from 'aws-sdk';
import { _Blob } from 'aws-sdk/clients/lambda';
import {
  AutotaskRelayerParams,
  IRelayer,
  JsonRpcRequest, 
  JsonRpcResponse, 
  RelayerModel,
  RelayerTransaction,
  RelayerTransactionPayload,
  SignedMessagePayload,
  SignMessagePayload,
} from './relayer';


export type SendTxRequest = {
  action: 'send-tx';
  payload: RelayerTransactionPayload;
};

export type GetTxRequest = {
  action: 'get-tx';
  payload: string;
};

export type SignRequest = {
  action: 'sign';
  payload: SignMessagePayload;
};

export type GetSelfRequest = {
  action: 'get-self';
};

export type JsonRpcCallRequest = {
  action: 'json-rpc-query';
  payload: JsonRpcRequest;
};

export type Request = SendTxRequest | GetTxRequest | SignRequest | GetSelfRequest | JsonRpcCallRequest;

// do our best to get .errorMessage, but return object by default
function cleanError(payload?: _Blob): _Blob {
  if (!payload) {
    return 'Error occurred, but error payload was not defined';
  }
  try {
    const errMsg = JSON.parse(payload.toString()).errorMessage;
    if (errMsg) {
      return errMsg;
    }
  } catch (e) {}
  return payload;
}

export class AutotaskRelayer implements IRelayer {
  private lambda: AWS.Lambda;
  private relayerARN: string;
  private jsonRpcRequestNextId: number;

  public constructor(params: AutotaskRelayerParams) {
    this.jsonRpcRequestNextId = 0;
    this.relayerARN = params.relayerARN;
    const creds = params.credentials ? JSON.parse(params.credentials) : undefined;
    this.lambda = new AWS.Lambda(
      creds
        ? {
            credentials: {
              accessKeyId: creds.AccessKeyId,
              secretAccessKey: creds.SecretAccessKey,
              sessionToken: creds.SessionToken,
            },
          }
        : undefined,
    );
  }

  public async sendTransaction(payload: RelayerTransactionPayload): Promise<RelayerTransaction> {
    return this.execute({ action: 'send-tx', payload });
  }

  public async getRelayer(): Promise<RelayerModel> {
    return this.execute({
      action: 'get-self' as const,
    });
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

  public async call(method: string, params: string[]): Promise<JsonRpcResponse> {
    return this.execute({
      action: 'json-rpc-query' as const,
      payload: { method, params, jsonrpc: '2.0', id: this.jsonRpcRequestNextId++ },
    });
  }

  private async execute<T>(request: Request): Promise<T> {
    const result = await this.lambda
      .invoke({
        FunctionName: this.relayerARN,
        Payload: JSON.stringify(request),
        InvocationType: 'RequestResponse',
      })
      .promise();
    if (result.FunctionError) {
      throw new Error(`Error while attempting ${request.action}: ${cleanError(result.Payload)}`);
    }
    return JSON.parse(result.Payload as string) as T;
  }
}

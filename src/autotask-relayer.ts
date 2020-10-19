import AWS from 'aws-sdk';

import {
  AutotaskRelayerParams,
  IRelayer,
  QueryPayload,
  RelayerTransaction,
  RelayerTransactionPayload,
  SendTxPayload,
  SignedMessagePayload,
  SignMessagePayload,
  SignPayload,
} from './relayer';

// do our best to get .errorMessage, but return object by default
function cleanError(payload: any): string {
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

  public constructor(params: AutotaskRelayerParams) {
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
      throw new Error(`Error while attempting ${payload.action}: ${cleanError(result.Payload)}`);
    }
    return JSON.parse(result.Payload as string) as T;
  }
}

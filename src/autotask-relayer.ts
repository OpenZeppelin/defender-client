import AWS from 'aws-sdk';
import util from 'util';

import {
  IRelayer,
  AutotaskRelayerParams,
  RelayerTransactionPayload,
  RelayerTransaction,
  SignMessagePayload,
  SignedMessagePayload,
  SendTxPayload,
  QueryPayload,
  SignPayload,
} from './relayer';

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

import {
  AutotaskRelayerParams,
  IRelayer,
  JsonRpcRequest,
  JsonRpcResponse,
  ListTransactionsRequest,
  RelayerModel,
  RelayerTransaction,
  RelayerTransactionPayload,
  SignedMessagePayload,
  SignMessagePayload,
} from '../relayer';

import { BaseAutotaskClient } from 'defender-base-client/lib/autotask';

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

export class AutotaskRelayer extends BaseAutotaskClient implements IRelayer {
  private jsonRpcRequestNextId: number;

  public constructor(params: AutotaskRelayerParams) {
    super(params.credentials, params.relayerARN);
    this.jsonRpcRequestNextId = 0;
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

  public async list(criteria?: ListTransactionsRequest): Promise<RelayerTransaction[]> {
    return this.execute({
      action: 'list-txs' as const,
      payload: criteria ?? {},
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
}

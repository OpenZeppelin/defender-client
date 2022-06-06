import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';
import { isRelayer, Relayer, RelayerParams } from '../relayer';

type Web3Callback = (error: Error | null, result?: JsonRpcResponse) => void;

export class DefenderRelayQueryProvider {
  protected relayer: Relayer;
  protected id = 1;

  constructor(relayerCredentials: RelayerParams | Relayer) {
    this.relayer = isRelayer(relayerCredentials) ? relayerCredentials : new Relayer(relayerCredentials);
  }
  public sendAsync(payload: JsonRpcPayload, callback: Web3Callback): void {
    return this.send(payload, callback);
  }

  public send(payload: JsonRpcPayload, callback: Web3Callback): void {
    const payloadId = typeof payload.id === 'string' ? parseInt(payload.id) : payload.id;
    this.relayer
      .call(payload.method, payload.params ?? [])
      .then((response) =>
        callback(null, {
          ...response,
          id: payloadId ?? response.id ?? this.id++,
        }),
      )
      .catch((err) => callback(err, undefined));
  }
}

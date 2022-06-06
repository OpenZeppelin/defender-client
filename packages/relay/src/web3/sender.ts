import { omit } from 'lodash';
import { callbackify, promisify } from 'util';
import { AbstractProvider } from 'web3-core';
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';
import { BigUInt, isRelayer, Relayer, RelayerParams, Speed } from '../relayer';

type Web3Callback = (error: Error | null, result?: JsonRpcResponse) => void;

// See packages/web3-core-helpers/src/formatters.js#_txInputFormatter
type Web3TxPayload = {
  gasPrice: string | undefined;
  maxFeePerGas: string | undefined;
  maxPriorityFeePerGas: string | undefined;
  gas: string | undefined;
  value: string | undefined;
  data: string | undefined;
  to: string | undefined;
  from: string | undefined;
  nonce: string | undefined;
};

export type DefenderRelaySenderOptions = Partial<{
  gasPrice: BigUInt;
  maxFeePerGas: BigUInt;
  maxPriorityFeePerGas: BigUInt;
  speed: Speed;
  validForSeconds: number;
}>;

export class DefenderRelaySenderProvider {
  protected relayer: Relayer;
  protected id = 1;
  protected txHashToId: Map<string, string> = new Map();

  private address: string | undefined;

  constructor(
    protected base: AbstractProvider,
    relayerCredentials: RelayerParams | Relayer,
    protected options: DefenderRelaySenderOptions = {},
  ) {
    this._delegateToProvider(base);
    this.relayer = isRelayer(relayerCredentials) ? relayerCredentials : new Relayer(relayerCredentials);
    if (options) {
      const getUnnecesaryExtraFields = (invalidFields: (keyof DefenderRelaySenderOptions)[]) =>
        invalidFields.map((field: keyof DefenderRelaySenderOptions) => options[field]).filter(Boolean);

      if (options.gasPrice) {
        const unnecesaryExtraFields = getUnnecesaryExtraFields(['maxFeePerGas', 'maxPriorityFeePerGas']);

        if (unnecesaryExtraFields.length > 0)
          throw new Error(`Inconsistent options: gasPrice + (${unnecesaryExtraFields}) not allowed`);
      } else if (options.maxFeePerGas && options.maxPriorityFeePerGas) {
        if (options.maxFeePerGas < options.maxPriorityFeePerGas)
          throw new Error('Inconsistent options: maxFeePerGas should be greater or equal to maxPriorityFeePerGas');
      } else if (options.maxFeePerGas)
        throw new Error('Inconsistent options: maxFeePerGas without maxPriorityFeePerGas specified');
      else if (options.maxPriorityFeePerGas)
        throw new Error('Inconsistent options: maxPriorityFeePerGas without maxFeePerGas specified');
    }
  }

  public get connected(): boolean | undefined {
    return this.base.connected;
  }

  public getTransactionId(hash: string): string | undefined {
    return this.txHashToId.get(hash);
  }

  protected async getAddress(): Promise<string> {
    if (!this.address) {
      const address = await this.relayer.getRelayer().then((r) => r.address);
      this.address = address;
    }
    return this.address;
  }

  public sendAsync(payload: JsonRpcPayload, callback: Web3Callback): void {
    return this.send(payload, callback);
  }

  public send(payload: JsonRpcPayload, callback: Web3Callback): void {
    const id = typeof payload.id === 'string' ? parseInt(payload.id) : payload.id ?? this.id++;
    const handleWith = (fn: (params: any[]) => Promise<any>) =>
      callbackify((payload: JsonRpcPayload) =>
        fn.call(this, payload.params ?? []).then((result) => ({
          jsonrpc: '2.0',
          id,
          result,
        })),
      )(payload, callback);

    switch (payload.method) {
      case 'eth_sendTransaction':
        return handleWith(this._sendTransaction);

      case 'eth_accounts':
        return handleWith(this._getAccounts);

      case 'eth_sign':
        return handleWith(this._signMessage);

      case 'eth_signTransaction':
        return callback(new Error(`Method not supported: eth_signTransaction`));
    }

    // Default by sending to base provider
    return (this.base.sendAsync ?? this.base.send).call(this.base, payload, callback);
  }

  protected async _getAccounts(params: any[]): Promise<string[]> {
    return [await this.getAddress()];
  }

  protected async _sendTransaction(params: any[]): Promise<string> {
    const tx = params[0] as Web3TxPayload;
    const relayerAddress = (await this.getAddress()).toLowerCase();
    if (tx.from && tx.from.toLowerCase() !== relayerAddress) {
      throw new Error(`Cannot send transaction from ${tx.from}`);
    }

    const gasLimit =
      tx.gas ??
      (await promisify(this.send.bind(this))({
        method: 'eth_estimateGas',
        params: [{ from: relayerAddress, gasLimit: 1e6, ...tx }],
        jsonrpc: '2.0',
        id: 1,
      }).then((response) => {
        if (response?.error) {
          throw new Error(`Error estimating gas for transaction: ${JSON.stringify(response.error)}`);
        }
        return response?.result?.toString();
      }));

    const txWithSpeed = this.options.speed
      ? { ...omit(tx, 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas'), speed: this.options.speed }
      : tx;
    const payload = { ...this.options, ...txWithSpeed, gasLimit };

    const sent = tx.nonce
      ? await this.relayer.replaceTransactionByNonce(parseInt(tx.nonce), payload)
      : await this.relayer.sendTransaction(payload);

    this.txHashToId.set(sent.hash, sent.transactionId);
    return sent.hash;
  }

  protected async _signMessage(params: any[]): Promise<string> {
    const [from, message] = params as [string, string];
    if (from.toLowerCase() !== (await this.getAddress()).toLowerCase()) {
      throw new Error(`Cannot sign message as ${from}`);
    }

    return this.relayer.sign({ message }).then((r) => r.sig);
  }

  protected _delegateToProvider(provider: any) {
    // Sorry for all the anys
    const delegate = (fn: any) => {
      if (typeof (provider[fn] as any) === 'function') {
        (this as any)[fn] = provider[fn].bind(provider);
      }
    };

    // If the subprovider is a ws or ipc provider, then register all its methods on this provider
    // and delegate calls to the subprovider. This allows subscriptions to work.
    delegate('eventNames');
    delegate('listeners');
    delegate('listenerCount');
    delegate('emit');
    delegate('on');
    delegate('addListener');
    delegate('once');
    delegate('removeListener');
    delegate('off');
    delegate('removeAllListeners');
    delegate('connect');
    delegate('reset');
    delegate('disconnect');
    delegate('supportsSubscriptions');
    delegate('reconnect');
  }
}

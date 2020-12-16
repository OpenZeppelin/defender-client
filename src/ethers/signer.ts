import { toUtf8Bytes } from '@ethersproject/strings';
import { Provider, TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { Bytes, hexlify, joinSignature } from '@ethersproject/bytes';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { Logger } from '@ethersproject/logger';
import { Deferrable, resolveProperties, shallowCopy } from '@ethersproject/properties';
import { Relayer, Speed, RelayerParams } from '../relayer';
import { Transaction } from '@ethersproject/transactions';

const logger = new Logger(`defender-relay-client`);

const allowedTransactionKeys: Array<string> = [
  'chainId',
  'data',
  'from',
  'gasLimit',
  'gasPrice',
  'nonce',
  'to',
  'value',
  'speed',
];

export type DefenderTransactionRequest = TransactionRequest & Partial<{ speed: Speed; validUntil: Date | string }>;
export type DefenderRelaySignerOptions = Partial<
  Pick<TransactionRequest, 'gasPrice'> & { speed: Speed; validForSeconds: number }
>;

type ProviderWithWrapTransaction = Provider & { _wrapTransaction(tx: Transaction, hash?: string): TransactionResponse };

function isRelayer(params: RelayerParams | Relayer): params is Relayer {
  return !!(params as any).getRelayer;
}

export class DefenderRelaySigner extends Signer {
  private readonly relayer: Relayer;
  private address?: string;

  constructor(
    readonly relayerCredentials: RelayerParams | Relayer,
    readonly provider: Provider,
    readonly options: DefenderRelaySignerOptions = {},
  ) {
    super();
    this.relayer = isRelayer(relayerCredentials) ? relayerCredentials : new Relayer(relayerCredentials);
    if (options && options.speed && options.gasPrice) {
      throw new Error(`Cannot set both speed and fixed gasPrice`);
    }
  }

  public async getAddress(): Promise<string> {
    // cache value because it does not change
    if (!this.address) {
      const r = await this.relayer.getRelayer();
      this.address = r.address;
    }
    return this.address;
  }

  // Returns the signed prefixed-message. This MUST treat:
  // - Bytes as a binary message
  // - string as a UTF8-message
  // i.e. "0x1234" is a SIX (6) byte string, NOT 2 bytes of data
  public async signMessage(message: string | Bytes): Promise<string> {
    if (typeof message === 'string') {
      message = toUtf8Bytes(message);
    }

    const sig = await this.relayer.sign({
      message: hexlify(message),
    });
    return joinSignature(sig);
  }

  // Signs a transaxction and returns the fully serialized, signed transaction.
  // The EXACT transaction MUST be signed, and NO additional properties to be added.
  // - This MAY throw if signing transactions is not supports, but if
  //   it does, sentTransaction MUST be overridden.
  public async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    throw new Error('DefenderRelaySigner#signTransaction: method not yet supported');
  }

  public connect(provider: Provider): Signer {
    return new DefenderRelaySigner(this.relayerCredentials, provider, this.options);
  }

  public async sendTransaction(transaction: Deferrable<DefenderTransactionRequest>): Promise<TransactionResponse> {
    this._checkProvider('sendTransaction');

    const tx = await this.populateTransaction(transaction);
    if (!tx.gasLimit) throw new Error('DefenderRelaySigner#sendTransacton: relayer gas estimation not yet supported');

    const relayedTransaction = await this.relayer.sendTransaction({
      to: tx.to,
      gasLimit: hexlify(tx.gasLimit),
      data: tx.data ? hexlify(tx.data) : undefined,
      speed: tx.speed,
      gasPrice: tx.gasPrice ? hexlify(tx.gasPrice) : undefined,
      value: tx.value ? hexlify(tx.value) : undefined,
      validUntil: tx.validUntil ? new Date(tx.validUntil).toISOString() : undefined,
    });

    return (this.provider as ProviderWithWrapTransaction)._wrapTransaction(
      {
        ...relayedTransaction,
        gasLimit: BigNumber.from(relayedTransaction.gasLimit),
        gasPrice: BigNumber.from(relayedTransaction.gasPrice),
        value: BigNumber.from(relayedTransaction.value),
      },
      relayedTransaction.hash,
    );
  }

  // Adapted from ethers-io/ethers.js/packages/abstract-signer/src.ts/index.ts
  // Defender relay does not require all fields to be populated
  async populateTransaction(transaction: Deferrable<DefenderTransactionRequest>): Promise<DefenderTransactionRequest> {
    const tx: Deferrable<DefenderTransactionRequest> = await resolveProperties(this.checkTransaction(transaction));
    if (tx.to != null) {
      tx.to = Promise.resolve(tx.to).then((to) => this.resolveName(to!));
    }

    if (tx.gasLimit == null) {
      tx.gasLimit = this.estimateGas(tx).catch((error) => {
        return logger.throwError(
          'cannot estimate gas; transaction may fail or may require manual gas limit',
          Logger.errors.UNPREDICTABLE_GAS_LIMIT,
          {
            error: error,
            tx: tx,
          },
        );
      });
    }

    if (!tx.speed && !tx.gasPrice) {
      if (this.options.gasPrice) {
        tx.gasPrice = this.options.gasPrice;
      } else if (this.options.speed) {
        tx.speed = this.options.speed;
      }
    }

    if (!tx.validUntil && this.options.validForSeconds) {
      tx.validUntil = new Date(Date.now() + this.options.validForSeconds * 1000);
    }

    return await resolveProperties(tx);
  }

  // Adapted from ethers-io/ethers.js/packages/abstract-signer/src.ts/index.ts
  // Defender relay accepts more transaction keys
  checkTransaction(transaction: Deferrable<DefenderTransactionRequest>): Deferrable<DefenderTransactionRequest> {
    for (const key in transaction) {
      if (allowedTransactionKeys.indexOf(key) === -1) {
        logger.throwArgumentError('invalid transaction key: ' + key, 'transaction', transaction);
      }
    }
    const tx = shallowCopy(transaction);

    tx.from = Promise.all([Promise.resolve(tx.from), this.getAddress()]).then((result) => {
      if (result[0] != null && result[0] !== result[1]) {
        logger.throwArgumentError('from address mismatch', 'transaction', transaction);
      }
      return result[1];
    });

    return tx;
  }
}

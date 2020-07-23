import { Provider, TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { Bytes, hexlify } from '@ethersproject/bytes';
import { BigNumber } from '@ethersproject/bignumber';
import { Logger } from '@ethersproject/logger';
import { Deferrable, resolveProperties, shallowCopy } from '@ethersproject/properties';
import { Relayer, Speed } from '../relayer';
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

export type DefenderTransactionRequest = TransactionRequest & { speed: Speed };
export type DefenderRelaySignerOptions = { speed?: Speed; from: string };

type ProviderWithWrapTransaction = Provider & { _wrapTransaction(tx: Transaction, hash?: string): TransactionResponse };

export class DefenderRelaySigner extends Signer {
  private readonly relayer: Relayer;

  constructor(
    private apiKey: string,
    private apiSecret: string,
    readonly provider: Provider,
    readonly options: DefenderRelaySignerOptions,
  ) {
    super();
    this.relayer = new Relayer(apiKey, apiSecret);
  }

  public async getAddress(): Promise<string> {
    return this.options.from;
  }

  public async signMessage(message: string | Bytes): Promise<string> {
    throw new Error('DefenderRelaySigner#signMessage: method not yet supported');
  }

  public async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    throw new Error('DefenderRelaySigner#signTransaction: method not yet supported');
  }

  public connect(provider: Provider): Signer {
    return new DefenderRelaySigner(this.apiKey, this.apiSecret, provider, this.options);
  }

  public async sendTransaction(transaction: Deferrable<DefenderTransactionRequest>): Promise<TransactionResponse> {
    this._checkProvider('sendTransaction');

    const tx = await this.populateTransaction(transaction);
    if (!tx.to) throw new Error('DefenderRelaySigner#sendTransacton: contract creation not yet supported');
    if (!tx.gasLimit) throw new Error('DefenderRelaySigner#sendTransacton: relayer gas estimation not yet supported');

    const relayedTransaction = await this.relayer.sendTransaction({
      to: tx.to,
      gasLimit: hexlify(tx.gasLimit),
      data: tx.data ? hexlify(tx.data) : undefined,
      speed: tx.speed,
      value: tx.value ? hexlify(tx.value) : undefined,
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

    if (!tx.speed) {
      tx.speed = this.options.speed || 'average';
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

    if (tx.from == null) {
      tx.from = this.getAddress();
    } else {
      // Make sure any provided address matches this signer
      tx.from = Promise.all([Promise.resolve(tx.from), this.getAddress()]).then((result) => {
        if (result[0] !== result[1]) {
          logger.throwArgumentError('from address mismatch', 'transaction', transaction);
        }
        return result[0];
      });
    }

    return tx;
  }
}

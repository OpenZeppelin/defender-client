/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { toUtf8Bytes } from '@ethersproject/strings';
import { Provider, TransactionRequest, TransactionResponse } from '@ethersproject/abstract-provider';
import { Signer, TypedDataDomain, TypedDataField, TypedDataSigner } from '@ethersproject/abstract-signer';
import { Bytes, hexlify, joinSignature } from '@ethersproject/bytes';
import { BigNumber } from '@ethersproject/bignumber';
import { Logger } from '@ethersproject/logger';
import { _TypedDataEncoder } from '@ethersproject/hash';
import { Deferrable, resolveProperties, shallowCopy } from '@ethersproject/properties';
import { Relayer, Speed, RelayerParams, isRelayer, isEIP1559Tx, isLegacyTx } from '../relayer';
import { Transaction } from '@ethersproject/transactions';
import { omit } from 'lodash';

const logger = new Logger(`@openzeppelin/defender-relay-client`);

const allowedTransactionKeys: Array<string> = [
  'chainId',
  'data',
  'from',
  'gasLimit',
  'gasPrice',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
  'nonce',
  'to',
  'value',
  'speed',
  'isPrivate',
];

type GasOptions = Pick<TransactionRequest, 'gasPrice' | 'maxFeePerGas' | 'maxPriorityFeePerGas'>;

export type DefenderTransactionRequest = TransactionRequest &
  Partial<{ speed: Speed; validUntil: Date | string; isPrivate?: boolean }>;
export type DefenderRelaySignerOptions = Partial<
  GasOptions & {
    speed: Speed;
    validForSeconds: number;
  }
>;

type ProviderWithWrapTransaction = Provider & {
  _wrapTransaction(tx: Transaction, hash?: string): TransactionResponse;
};

export class DefenderRelaySigner extends Signer implements TypedDataSigner {
  private readonly relayer: Relayer;
  private address?: string;

  constructor(
    readonly relayerCredentials: RelayerParams | Relayer,
    readonly provider: Provider,
    readonly options: DefenderRelaySignerOptions = {},
  ) {
    super();
    this.relayer = isRelayer(relayerCredentials) ? relayerCredentials : new Relayer(relayerCredentials);
    if (options) {
      const getUnnecesaryExtraFields = (invalidFields: (keyof GasOptions)[]) =>
        invalidFields.map((field: keyof GasOptions) => options[field]).filter(Boolean);

      if (options.speed) {
        const unnecesaryExtraFields = getUnnecesaryExtraFields(['maxFeePerGas', 'maxPriorityFeePerGas', 'gasPrice']);

        if (unnecesaryExtraFields.length > 0)
          throw new Error(`Inconsistent options: speed + (${unnecesaryExtraFields}) not allowed`);
      } else if (options.gasPrice) {
        const unnecesaryExtraFields = getUnnecesaryExtraFields([
          'maxFeePerGas',
          'maxPriorityFeePerGas',
          // speed already checked
        ]);

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

  // Signs a transaction and returns the fully serialized, signed transaction.
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
    const nonce = tx.nonce === undefined ? undefined : BigNumber.from(tx.nonce).toNumber();

    let payloadGasParams;

    if (isLegacyTx(tx) && tx.gasPrice !== undefined) {
      payloadGasParams = {
        gasPrice: hexlify(tx.gasPrice),
      };
    } else if (isEIP1559Tx(tx) && tx.maxFeePerGas !== undefined && tx.maxPriorityFeePerGas !== undefined) {
      payloadGasParams = {
        maxFeePerGas: hexlify(tx.maxFeePerGas),
        maxPriorityFeePerGas: hexlify(tx.maxPriorityFeePerGas),
      };
    }

    const payload = {
      to: tx.to,
      gasLimit: hexlify(tx.gasLimit),
      data: tx.data ? hexlify(tx.data) : undefined,
      speed: tx.speed,
      value: tx.value ? hexlify(tx.value) : undefined,
      validUntil: tx.validUntil ? new Date(tx.validUntil).toISOString() : undefined,
      isPrivate: tx.isPrivate,
      ...payloadGasParams,
    };

    const relayedTransaction = nonce
      ? await this.relayer.replaceTransactionByNonce(nonce, payload)
      : await this.relayer.sendTransaction(payload);

    let gasParams;

    if (isEIP1559Tx(relayedTransaction)) {
      gasParams = {
        maxFeePerGas: BigNumber.from(relayedTransaction.maxFeePerGas),
        maxPriorityFeePerGas: BigNumber.from(relayedTransaction.maxPriorityFeePerGas),
      };
    } else {
      gasParams = {
        gasPrice: BigNumber.from(relayedTransaction.gasPrice),
      };
    }

    return (this.provider as ProviderWithWrapTransaction)._wrapTransaction(
      {
        ...omit(relayedTransaction, 'gasPrice', 'maxPriorityFeePerGas', 'maxFeePerGas'),
        ...gasParams,
        gasLimit: BigNumber.from(relayedTransaction.gasLimit),
        value: BigNumber.from(relayedTransaction.value ?? 0),
        data: relayedTransaction.data ?? '',
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

    if (!tx.speed && !tx.gasPrice && !tx.maxFeePerGas && !tx.maxPriorityFeePerGas) {
      if (this.options.gasPrice) {
        tx.gasPrice = this.options.gasPrice;
      } else if (this.options.maxFeePerGas && this.options.maxPriorityFeePerGas) {
        tx.maxFeePerGas = this.options.maxFeePerGas;
        tx.maxPriorityFeePerGas = this.options.maxPriorityFeePerGas;
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
      if (!!result[0] && result[0].toLowerCase() !== result[1].toLowerCase()) {
        logger.throwArgumentError('from address mismatch', 'transaction', transaction);
      }
      return result[1];
    });

    return tx;
  }

  /**
   * Signs the typed data value with types data structure for domain using the EIP-712 specification.
   * https://eips.ethereum.org/EIPS/eip-712
   *
   * @param domain EIP712Domain containing name, version, chainId, verifyingContract and salt. All optional
   * @param types set of all types encompassed by struct
   * @param value typed data to sign matching provided types
   * @returns typed data signature
   */
  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<string> {
    const domainSeparator = _TypedDataEncoder.hashDomain(domain);
    const hashStructMessage = _TypedDataEncoder.from(types).hash(value);

    const sig = await this.relayer.signTypedData({
      domainSeparator: hexlify(domainSeparator),
      hashStructMessage: hexlify(hashStructMessage),
    });

    return joinSignature(sig);
  }
}

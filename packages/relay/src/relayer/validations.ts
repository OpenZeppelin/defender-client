import { Relayer } from './client';
import { RelayerTransactionPayload, SendBaseTransactionRequest } from './types';

/**
 * If a tx-like object is representing a legacy transaction (type 0)
 */
export function isLegacyTx<TransactionLikeType>(
  tx: TransactionLikeType,
): tx is TransactionLikeType & { gasPrice: NonNullable<unknown> } {
  // Consider that an EIP1559 tx may have `gasPrice` after
  // https://github.com/OpenZeppelin/defender/pull/2838
  // that's why the !isEIP1559Tx check
  return 'gasPrice' in tx && !isEIP1559Tx(tx);
}

/**
 * If a tx-like object is representing a EIP1559 transaction (type 2)
 */
export function isEIP1559Tx<TransactionLikeType>(tx: TransactionLikeType): tx is TransactionLikeType & {
  maxPriorityFeePerGas: NonNullable<number | string>;
  maxFeePerGas: NonNullable<number | string>;
} {
  return 'maxPriorityFeePerGas' in tx && 'maxFeePerGas' in tx;
}

export function isRelayer(params: unknown): params is Relayer {
  return Boolean(params && typeof params === 'object' && params.hasOwnProperty('getRelayer'));
}

export function validateRelayerRequestPayload(payload: RelayerTransactionPayload): SendBaseTransactionRequest {
  if (isEIP1559Tx(payload) && BigInt(payload.maxFeePerGas) < BigInt(payload.maxPriorityFeePerGas)) {
    throw new Error('maxFeePerGas should be greater or equal to maxPriorityFeePerGas');
  }
  if (payload.validUntil && new Date(payload.validUntil).getTime() < new Date().getTime()) {
    throw new Error('The validUntil time cannot be in the past');
  }
  if (!payload.to && !payload.data) {
    throw new Error('Both txs `to` and `data` fields are missing. At least one of them has to be set.');
  }
  return payload;
}

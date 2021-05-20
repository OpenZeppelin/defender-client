import { BigNumber } from '@ethersproject/bignumber';
import { Provider, TransactionResponse } from '@ethersproject/providers';
import { Transaction } from '@ethersproject/transactions';
import { Contract } from '@ethersproject/contracts';
import { mock } from 'jest-mock-extended';
import { omit, pick } from 'lodash';
import { Relayer, RelayerTransaction } from '../relayer';
import { DefenderRelaySigner } from './signer';

type ProviderWithWrapTransaction = Provider & { _wrapTransaction(tx: Transaction, hash?: string): TransactionResponse };

describe('ethers/signer', () => {
  const relayer = mock<Relayer>();
  const provider = mock<ProviderWithWrapTransaction>();
  const from = '0xe800aaf7b88110298433e9d436a92d582119da96';

  const tx: RelayerTransaction = {
    chainId: 4,
    from,
    gasLimit: 60000,
    gasPrice: 1e9,
    hash: '0xdfd0144b0ed02b10ee1ca5a6ead42709d1ce495ecb6d28d9c8dfcb0146bd94ed',
    nonce: 30,
    speed: 'safeLow',
    status: 'sent',
    to: '0xc7464dbcA260A8faF033460622B23467Df5AEA42',
    transactionId: '1',
    validUntil: '2031-05-19T23:09:47.129Z',
    data: '0x01',
    value: '0x02',
  };

  const transferAbi = [
    {
      inputs: [
        { internalType: 'address', name: 'recipient', type: 'address' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
      ],
      name: 'transfer',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    relayer.getRelayer.mockResolvedValue({
      network: 'rinkeby',
      address: from,
      relayerId: '1',
      createdAt: '',
      name: 'My relayer',
      paused: false,
      pendingTxCost: '0',
    });

    provider._wrapTransaction.mockImplementation((arg) => ({
      ...tx,
      ...arg,
      confirmations: 0,
      wait: () => {
        throw new Error();
      },
    }));

    provider.resolveName.mockImplementation((arg) => Promise.resolve(arg));
  });

  const expectSentTx = (actual: TransactionResponse) => {
    expect(actual).toEqual(
      expect.objectContaining({
        ...tx,
        value: BigNumber.from(tx.value),
        gasPrice: BigNumber.from(tx.gasPrice),
        gasLimit: BigNumber.from(tx.gasLimit),
      }),
    );
  };

  it('sends a tx with speed', async () => {
    relayer.sendTransaction.mockResolvedValue(tx);

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });
    const request = pick(tx, 'to', 'data', 'value', 'gasLimit');
    const sent = await signer.sendTransaction(request);

    expectSentTx(sent);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      ...request,
      gasLimit: '0xea60',
      speed: tx.speed,
      gasPrice: undefined,
      validUntil: undefined,
    });
  });

  it('sends a tx with fixed gas price', async () => {
    relayer.sendTransaction.mockResolvedValue(tx);

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });
    const request = pick(tx, 'to', 'data', 'value', 'gasLimit', 'gasPrice');
    const sent = await signer.sendTransaction(request);

    expectSentTx(sent);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      ...request,
      gasLimit: '0xea60',
      speed: undefined,
      gasPrice: '0x3b9aca00',
      validUntil: undefined,
    });
  });

  it('replaces a tx by nonce', async () => {
    relayer.replaceTransactionByNonce.mockResolvedValue(tx);

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });
    const request = pick(tx, 'to', 'data', 'value', 'gasLimit', 'nonce');
    const sent = await signer.sendTransaction(request);

    expectSentTx(sent);
    expect(relayer.replaceTransactionByNonce).toHaveBeenCalledWith(30, {
      ...omit(request, 'nonce'),
      gasLimit: '0xea60',
      speed: tx.speed,
      gasPrice: undefined,
      validUntil: undefined,
    });
  });

  it('sends a contract tx', async () => {
    relayer.sendTransaction.mockResolvedValue(tx);
    provider.estimateGas.mockResolvedValueOnce(BigNumber.from('0xea60'));
    provider.getCode.mockResolvedValueOnce('0x010203');

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });
    const contract = new Contract(tx.to, transferAbi, signer);
    const sent = await contract.transfer(from, '0x02');

    expectSentTx(sent);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      data: contract.interface.encodeFunctionData('transfer', [from, '0x02']),
      gasLimit: '0xea60',
      speed: 'safeLow',
      to: tx.to,
      value: undefined,
      gasPrice: undefined,
      validUntil: undefined,
    });
  });

  it('replaces a contract tx', async () => {
    relayer.replaceTransactionByNonce.mockResolvedValue(tx);
    provider.estimateGas.mockResolvedValueOnce(BigNumber.from('0xea60'));
    provider.getCode.mockResolvedValueOnce('0x010203');

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });
    const contract = new Contract(tx.to, transferAbi, signer);
    const sent = await contract.transfer(from, '0x02', { nonce: tx.nonce });

    expectSentTx(sent);
    expect(relayer.replaceTransactionByNonce).toHaveBeenCalledWith(30, {
      data: contract.interface.encodeFunctionData('transfer', [from, '0x02']),
      gasLimit: '0xea60',
      speed: 'safeLow',
      to: tx.to,
      value: undefined,
      gasPrice: undefined,
      validUntil: undefined,
    });
  });
});

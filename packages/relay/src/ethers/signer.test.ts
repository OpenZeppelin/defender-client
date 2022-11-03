import { BigNumber } from '@ethersproject/bignumber';
import { Provider, TransactionResponse } from '@ethersproject/providers';
import { Transaction } from '@ethersproject/transactions';
import { Contract } from '@ethersproject/contracts';
import { mock } from 'jest-mock-extended';
import { omit, pick } from 'lodash';
import { Relayer, RelayerTransaction, isEIP1559Tx, isLegacyTx } from '../relayer';
import { joinSignature, hexlify } from '@ethersproject/bytes';
import { randomBytes } from '@ethersproject/random';
import { DefenderRelaySigner } from './signer';
import { _TypedDataEncoder } from '@ethersproject/hash';

type ProviderWithWrapTransaction = Provider & { _wrapTransaction(tx: Transaction, hash?: string): TransactionResponse };

describe('ethers/signer', () => {
  const relayer = mock<Relayer>();
  const provider = mock<ProviderWithWrapTransaction>();
  const from = '0xe800aaf7b88110298433e9d436a92d582119da96';

  const tx: RelayerTransaction = {
    chainId: 4,
    from,
    gasLimit: 60000,
    maxFeePerGas: 10e9,
    maxPriorityFeePerGas: 1e9,
    hash: '0xdfd0144b0ed02b10ee1ca5a6ead42709d1ce495ecb6d28d9c8dfcb0146bd94ed',
    nonce: 30,
    speed: 'safeLow',
    status: 'sent',
    to: '0xc7464dbcA260A8faF033460622B23467Df5AEA42',
    transactionId: '1',
    validUntil: '2031-05-19T23:09:47.129Z',
    data: '0x01',
    value: '0x02',
    createdAt: '2022-10-30T00:11:35.501Z',
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
      minBalance: '100000000000000000',
      policies: {},
    });

    provider._wrapTransaction.mockImplementation((arg) => {
      let gasParams;

      if (isEIP1559Tx(arg)) {
        gasParams = {
          maxFeePerGas: BigNumber.from(arg.maxFeePerGas),
          maxPriorityFeePerGas: BigNumber.from(arg.maxPriorityFeePerGas),
        };
      } else {
        gasParams = {
          gasPrice: BigNumber.from(arg.gasPrice),
        };
      }

      return {
        ...omit({ ...tx, ...arg }, 'gasPrice', 'maxFeePerGas', 'maxPriorityFeePerGas'),
        ...gasParams,
        confirmations: 0,
        wait: () => {
          throw new Error();
        },
      };
    });

    provider.resolveName.mockImplementation((arg) => Promise.resolve(arg));
  });

  const expectSentTx = (actual: TransactionResponse, expected: Partial<RelayerTransaction>) => {
    let gasParams;

    if (isEIP1559Tx(expected)) {
      gasParams = {
        maxFeePerGas: BigNumber.from(expected.maxFeePerGas),
        maxPriorityFeePerGas: BigNumber.from(expected.maxPriorityFeePerGas),
      };
    } else if (isLegacyTx(expected)) {
      gasParams = {
        gasPrice: BigNumber.from(expected.gasPrice),
      };
    }
    expect(actual).toEqual(
      expect.objectContaining({
        ...expected,
        ...gasParams,
        value: BigNumber.from(expected.value),
        gasLimit: BigNumber.from(expected.gasLimit),
      }),
    );
  };

  it('sends a tx with speed', async () => {
    relayer.sendTransaction.mockResolvedValue(tx);

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });
    const request = pick(tx, 'to', 'data', 'value', 'gasLimit');
    const sent = await signer.sendTransaction(request);

    expectSentTx(sent, tx);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      ...request,
      gasLimit: '0xea60',
      speed: tx.speed,
      validUntil: undefined,
    });
  });

  it('sends a tx with fixed gasPrice', async () => {
    relayer.sendTransaction.mockResolvedValue({ ...omit(tx, 'maxFeePerGas', 'maxPriorityFeePerGas'), gasPrice: 1e9 });

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });
    const request = { ...pick(tx, 'to', 'data', 'value', 'gasLimit'), gasPrice: 1e9 };
    const sent = await signer.sendTransaction(request);

    expectSentTx(sent, request);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      ...request,
      gasLimit: '0xea60',
      speed: undefined,
      gasPrice: '0x3b9aca00',
      validUntil: undefined,
    });
  });

  it('sends a tx with fixed maxFeePerGas and maxPriorityFeePerGas', async () => {
    relayer.sendTransaction.mockResolvedValue(tx);

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });
    const request = pick(tx, 'to', 'data', 'value', 'gasLimit', 'maxFeePerGas', 'maxPriorityFeePerGas');
    const sent = await signer.sendTransaction(request);

    expectSentTx(sent, request);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      ...request,
      gasLimit: '0xea60',
      speed: undefined,
      maxFeePerGas: '0x02540be400',
      maxPriorityFeePerGas: '0x3b9aca00',
      validUntil: undefined,
    });
  });

  it('replaces a tx by nonce', async () => {
    relayer.replaceTransactionByNonce.mockResolvedValue(tx);

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });
    const request = pick(tx, 'to', 'data', 'value', 'gasLimit', 'nonce');
    const sent = await signer.sendTransaction(request);

    expectSentTx(sent, request);
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

    expectSentTx(sent, tx);
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

    expectSentTx(sent, tx);
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

  it('signs typed data', async () => {
    const domain = {
      name: 'Ether Mail',
      version: '1',
      chainId: 1,
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    };

    const types = {
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    };

    const value = {
      from: {
        name: 'Cow',
        wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
      },
      to: {
        name: 'Bob',
        wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
      },
      contents: 'Hello, Bob!',
    };

    const TypedDataEncoder = mock<_TypedDataEncoder>();
    const hashDomainSpy = jest.spyOn(_TypedDataEncoder, 'hashDomain').mockReturnValue(hexlify(randomBytes(32)));
    const fromSpy = jest.spyOn(_TypedDataEncoder, 'from').mockReturnValue(TypedDataEncoder);
    const hashSpy = jest.spyOn(TypedDataEncoder, 'hash').mockReturnValue(hexlify(randomBytes(32)));

    const signatureResponse = {
      r: '0xd1556332df97e3bd911068651cfad6f975a30381f4ff3a55df7ab3512c78b9ec',
      s: '0x66b51cbb10cd1b2a09aaff137d9f6d4255bf73cb7702b666ebd5af502ffa4410',
      v: 28,
      sig: '0xdead',
    };

    relayer.signTypedData.mockResolvedValue(signatureResponse);

    const signer = new DefenderRelaySigner(relayer, provider, { speed: 'safeLow' });

    const signature = await signer._signTypedData(domain, types, value);

    expect(hashDomainSpy).toHaveBeenCalledWith(domain);
    expect(fromSpy).toHaveBeenCalledWith(types);
    expect(hashSpy).toHaveBeenCalledWith(value);
    expect(signature).toEqual(joinSignature(signatureResponse));
  });
});

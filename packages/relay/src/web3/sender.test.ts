import { mock } from 'jest-mock-extended';
import { pick } from 'lodash';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import { Relayer, RelayerTransaction } from '../relayer';
import { DefenderRelayQueryProvider } from './query';
import { DefenderRelaySenderOptions, DefenderRelaySenderProvider } from './sender';

type DefenderRelaySenderProviderWithOptions = DefenderRelaySenderProvider & { options: DefenderRelaySenderOptions };

describe('web3/sender', () => {
  const relayer = mock<Relayer>();
  const provider = mock<DefenderRelayQueryProvider>();
  const from = '0xe800aaf7b88110298433e9d436a92d582119da96';
  const replacedHash = '0xc62660fd5929bfb45f4e6a1d9aac2db52badc635def9bcbf9ead5721d2d0c355';

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

  const transferAbi: AbiItem[] = [
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

  let sender: DefenderRelaySenderProviderWithOptions;
  let web3: Web3;

  beforeEach(() => {
    jest.resetAllMocks();

    relayer.getRelayer.mockResolvedValue({
      network: 'goerli',
      address: from,
      relayerId: '1',
      createdAt: '',
      name: 'My relayer',
      paused: false,
      pendingTxCost: '0',
      minBalance: '100000000000000000',
      policies: {},
    });

    provider.sendAsync.mockImplementation((payload, callback) => {
      const result = (value: any) =>
        callback(null, {
          result: value,
          jsonrpc: '2.0',
          id: typeof payload.id === 'number' ? payload.id! : parseInt(payload.id!),
        });

      switch (payload.method) {
        case 'eth_gasPrice':
          return result('0x3b9aca00');
        case 'eth_estimateGas':
          return result('0xea60');
        case 'eth_getTransactionReceipt':
          return result(null);
        case 'eth_subscribe':
          return result('0x9cef478923ff08bf67fde6c64013158d');
        case 'eth_getBlockByNumber':
          return result('0x6b11e5');
        default:
          console.log(payload);
      }
    });

    sender = new DefenderRelaySenderProvider(provider, relayer) as DefenderRelaySenderProviderWithOptions;
    web3 = new Web3(sender);
  });

  it('sends a tx with speed', async () => {
    relayer.sendTransaction.mockResolvedValue(tx);

    sender.options.speed = 'safeLow';
    const request = pick(tx, 'from', 'to', 'data', 'value');
    const sent = await new Promise((resolve) => web3.eth.sendTransaction(request).on('transactionHash', resolve));

    expect(sent).toEqual(tx.hash);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      ...request,
      gasLimit: '0xea60',
      speed: tx.speed,
      gasPrice: undefined,
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
      validUntil: undefined,
    });
  });

  it('sends a tx with fixed gasPrice', async () => {
    relayer.sendTransaction.mockResolvedValue({ ...tx, gasPrice: 1e9 });

    sender.options.speed = undefined;
    const request = { ...pick(tx, 'from', 'to', 'data', 'value', 'gasLimit'), gasPrice: 1e9 };
    const sent = await new Promise((resolve) => web3.eth.sendTransaction(request).on('transactionHash', resolve));

    expect(sent).toEqual(tx.hash);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      ...request,
      gasLimit: '0xea60',
      speed: undefined,
      gasPrice: '0x3b9aca00',
      maxFeePerGas: undefined,
      maxPriorityFeePerGas: undefined,
    });
  });

  it('sends a tx with fixed maxFeePerGas and maxPriorityFeePerGas', async () => {
    relayer.sendTransaction.mockResolvedValue(tx);

    sender.options.speed = undefined;
    const request = pick(tx, 'from', 'to', 'data', 'value', 'gasLimit', 'maxFeePerGas', 'maxPriorityFeePerGas');
    const sent = await new Promise((resolve) => web3.eth.sendTransaction(request).on('transactionHash', resolve));

    expect(sent).toEqual(tx.hash);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      ...request,
      gasLimit: '0xea60',
      speed: undefined,
      gasPrice: undefined,
      maxFeePerGas: '0x2540be400',
      maxPriorityFeePerGas: '0x3b9aca00',
    });
  });

  it('replaces a tx by nonce', async () => {
    relayer.replaceTransactionByNonce.mockResolvedValue({ ...tx, hash: replacedHash });

    const request = pick(tx, 'from', 'to', 'data', 'value', 'gasLimit', 'nonce');
    const sent = await new Promise((resolve) => web3.eth.sendTransaction(request).on('transactionHash', resolve));

    expect(sent).toEqual(replacedHash);
    expect(relayer.replaceTransactionByNonce).toHaveBeenCalledWith(30, {
      ...request,
      gasLimit: '0xea60',
      speed: undefined,
      gasPrice: '0x3b9aca00',
    });

    relayer.replaceTransactionByNonce.mockResolvedValue(tx);
  });

  it('sends a contract tx', async () => {
    relayer.sendTransaction.mockResolvedValue(tx);

    sender.options.speed = 'safeLow';
    const contract = new web3.eth.Contract(transferAbi, tx.to, { from });
    const sent = await new Promise((resolve) =>
      contract.methods.transfer(from, '0x02').send().on('transactionHash', resolve),
    );

    expect(sent).toEqual(tx.hash);
    expect(relayer.sendTransaction).toHaveBeenCalledWith({
      ...pick(tx, 'from', 'gaslimit', 'speed'),
      data: contract.methods.transfer(from, '0x02').encodeABI(),
      to: tx.to.toLowerCase(),
      gasLimit: '0xea60',
      speed: tx.speed,
      gasPrice: undefined,
      validUntil: undefined,
    });
  });

  it('replaces a contract tx', async () => {
    relayer.replaceTransactionByNonce.mockResolvedValue(tx);

    sender.options.speed = 'safeLow';
    const contract = new web3.eth.Contract(transferAbi, tx.to, { from });
    const sent = await new Promise((resolve) =>
      contract.methods.transfer(from, '0x02').send({ nonce: tx.nonce }).on('transactionHash', resolve),
    );

    expect(sent).toEqual(tx.hash);
    expect(relayer.replaceTransactionByNonce).toHaveBeenCalledWith(30, {
      ...pick(tx, 'from', 'gaslimit', 'speed'),
      nonce: '0x1e',
      data: contract.methods.transfer(from, '0x02').encodeABI(),
      to: tx.to.toLowerCase(),
      gasLimit: '0xea60',
      speed: tx.speed,
      gasPrice: undefined,
      validUntil: undefined,
    });
  });
});

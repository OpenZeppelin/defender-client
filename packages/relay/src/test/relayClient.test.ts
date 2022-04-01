import { RelayClient } from '../api';
import axios, { AxiosInstance } from 'axios';
import {  } from '../../../base/src/index'
import { RelayerModel, UpdateRelayerPoliciesRequest, UpdateRelayerRequest } from '../relayer';

jest.mock('axios');

type TestRelayClient = Omit<RelayClient, 'api'> & {
  api: AxiosInstance;
  init: () => Promise<void>;
};

describe('RelayClient', () => {
  let relayer: TestRelayClient;
  const relayerId = '1';
  const mockRelayerResponse: RelayerModel = {
    network: 'rinkeby',
    address: '0x0',
    relayerId: relayerId,
    createdAt: '',
    name: 'foo',
    paused: false,
    pendingTxCost: '0',
    minBalance: '100000000000000000',
    policies: {},
  };

  const policiesUpdate: UpdateRelayerRequest = {
    policies: { gasPriceCap: '100000000000000000' },
  };
  const nonPoliciesUpdate: UpdateRelayerRequest = {
    name: 'bar',
  };

  beforeEach(async function () {
    relayer = (new RelayClient({ apiKey: 'key', apiSecret: 'secret' }) as unknown) as TestRelayClient;
    await relayer.init();
    relayer.api.put = jest.fn();
    relayer.api.get = jest.fn().mockResolvedValue(mockRelayerResponse);
  });

  describe('update', () => {
    test.each([
      [1, policiesUpdate],
      [1, nonPoliciesUpdate],
      [2, { ...policiesUpdate, ...nonPoliciesUpdate }],
    ])(
      'calls put %s times on update with params %s',
      async (expectedPutCalls: number, updateParams: UpdateRelayerRequest) => {
        await relayer.update(relayerId, updateParams);
        expect(relayer.api.put).toHaveBeenCalledTimes(expectedPutCalls);
      },
    );

    test.each([
      [policiesUpdate, `/relayers/${relayerId}`, policiesUpdate.policies],
      [nonPoliciesUpdate, '/relayers', { ...mockRelayerResponse, ...nonPoliciesUpdate }],
    ])(
      'calls put with expected data for input %s on update with params %s',
      async (
        inputUpdateParams: UpdateRelayerRequest,
        endpoint: string,
        expectedPutBody: UpdateRelayerRequest | UpdateRelayerPoliciesRequest | undefined,
      ) => {
        await relayer.update(relayerId, inputUpdateParams);
        expect(relayer.api.put).toHaveBeenCalledWith(endpoint, expectedPutBody);
      },
    );
  });
});

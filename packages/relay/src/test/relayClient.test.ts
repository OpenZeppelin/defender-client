import { RelayClient } from '../api';
import { AxiosInstance } from 'axios';
import { RelayerGetResponse, UpdateRelayerPoliciesRequest, UpdateRelayerRequest } from '../relayer';
import { merge } from 'lodash';

jest.mock('axios');

type TestRelayClient = Omit<RelayClient, 'api'> & {
  api: AxiosInstance;
  init: () => Promise<void>;
};

describe('RelayClient', () => {
  let relayer: TestRelayClient;
  const relayerId = '1';
  const mockRelayerResponse: RelayerGetResponse = {
    network: 'rinkeby',
    address: '0x0',
    relayerId: relayerId,
    createdAt: '',
    name: 'foo',
    paused: false,
    pendingTxCost: '0',
    minBalance: (1e17).toString(),
    policies: {},
  };

  const mockRelayerResponseWithPolicies = merge(mockRelayerResponse, { policies: { gasPriceCap: 1e3 } });

  const policiesUpdate1: UpdateRelayerRequest = {
    policies: { gasPriceCap: 1e17 },
  };

  const policiesUpdate2: UpdateRelayerRequest = {
    policies: { whitelistReceivers: ['0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B'] },
  };

  const policiesUpdate3: UpdateRelayerRequest = {
    policies: { EIP1559Pricing: true },
  };

  const nonPoliciesUpdate: UpdateRelayerRequest = {
    name: 'bar',
  };

  beforeEach(async function () {
    relayer = new RelayClient({ apiKey: 'key', apiSecret: 'secret' }) as unknown as TestRelayClient;
    await relayer.init();
    relayer.api.put = jest.fn();
    relayer.api.get = jest.fn().mockResolvedValue(mockRelayerResponse);
  });

  describe('update', () => {
    test.each([
      [1, policiesUpdate1],
      [1, nonPoliciesUpdate],
      [2, { ...policiesUpdate1, ...nonPoliciesUpdate }],
    ])(
      'calls put %s times on update with params %s',
      async (expectedPutCalls: number, updateParams: UpdateRelayerRequest) => {
        await relayer.update(relayerId, updateParams);
        expect(relayer.api.put).toHaveBeenCalledTimes(expectedPutCalls);
      },
    );

    test.each([
      [policiesUpdate1, `/relayers/${relayerId}`, policiesUpdate1.policies],
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

    test.each([
      [policiesUpdate1, policiesUpdate1.policies as UpdateRelayerPoliciesRequest],
      [
        policiesUpdate2,
        { ...mockRelayerResponseWithPolicies.policies, ...policiesUpdate2.policies } as UpdateRelayerPoliciesRequest,
      ],
      [
        policiesUpdate3,
        { ...mockRelayerResponseWithPolicies.policies, ...policiesUpdate3.policies } as UpdateRelayerPoliciesRequest,
      ],
    ])(
      'calls put with expected policy update given base policy %s',
      async (inputPoliciesUpdate: UpdateRelayerRequest, expectedPutBody: UpdateRelayerPoliciesRequest) => {
        relayer.api.get = jest.fn().mockResolvedValue(mockRelayerResponseWithPolicies);
        await relayer.update(relayerId, inputPoliciesUpdate);
        expect(relayer.api.put).toHaveBeenCalledWith(
          `/relayers/${mockRelayerResponseWithPolicies.relayerId}`,
          expectedPutBody,
        );
      },
    );
  });
});

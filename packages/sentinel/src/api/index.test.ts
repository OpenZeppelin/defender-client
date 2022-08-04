import { AxiosInstance } from 'axios';
import { SentinelClient } from '.';
import { NotificationResponse } from '..';
import { BlockWatcher } from '../models/blockwatcher';
import {
  CreateNotificationRequest,
  DeleteNotificationRequest,
  GetNotificationRequest,
  UpdateNotificationRequest,
} from '../models/notification';
import { CreateSentinelResponse } from '../models/response';
import { ExternalCreateBlockSubscriberRequest, ExternalCreateFortaSubscriberRequest } from '../models/subscriber';

jest.mock('defender-base-client');
jest.mock('aws-sdk');
jest.mock('axios');

type TestSentinelClient = Omit<SentinelClient, 'api'> & {
  api: AxiosInstance;
  apiKey: string;
  apiSecret: string;
  init: () => Promise<void>;
};

describe('SentinelClient', () => {
  let sentinel: TestSentinelClient;
  let initSpy: jest.SpyInstance<Promise<void>, []>;
  let listBlockwatchersSpy: jest.SpyInstance<Promise<BlockWatcher[]>>;
  let listNotificationChannelsSpy: jest.SpyInstance<Promise<NotificationResponse[]>>;
  const createBlockPayload: ExternalCreateBlockSubscriberRequest = {
    type: 'BLOCK',
    name: 'Test BLOCK sentinel',
    addresses: ['0xdead'],
    notificationChannels: [],
    network: 'rinkeby',
    confirmLevel: 1,
    paused: false,
  };
  const createFortaPayload: ExternalCreateFortaSubscriberRequest = {
    type: 'FORTA',
    name: 'Test FORTA sentinel',
    addresses: ['0xdead'],
    notificationChannels: [],
    paused: false,
    fortaConditions: { minimumScannerCount: 1 },
  };

  const oldBlockSentinel: CreateSentinelResponse = {
    type: 'BLOCK',
    subscriberId: 'old-subscriber-id',
    name: 'Previous sentinel',
    paused: false,
    blockWatcherId: 'i-am-the-watcher',
    network: 'rinkeby',
    addressRules: [
      {
        abi: '[{ method: "type" }]',
        addresses: ['0xdead1', '0xdead2'],
        conditions: [
          {
            eventConditions: [{ eventSignature: '0x01' }],
            txConditions: [],
            functionConditions: [],
          },
        ],
      },
    ],
  };

  beforeEach(() => {
    sentinel = new SentinelClient({ apiKey: 'key', apiSecret: 'secret' }) as unknown as TestSentinelClient;
    initSpy = jest.spyOn(sentinel, 'init');
    listBlockwatchersSpy = jest.spyOn(sentinel, 'listBlockwatchers').mockImplementation(async () => [
      {
        blockWatcherId: 'i-am-the-watcher',
        network: createBlockPayload.network,
        confirmLevel: createBlockPayload.confirmLevel,
      } as BlockWatcher,
    ]);
    listNotificationChannelsSpy = jest
      .spyOn(sentinel, 'listNotificationChannels')
      .mockImplementation(async () => [{} as NotificationResponse]);
  });

  describe('constructor', () => {
    it('sets API key and secret', () => {
      expect(sentinel.apiKey).toBe('key');
      expect(sentinel.apiSecret).toBe('secret');
    });

    it("doesn't call init more than once", async () => {
      await sentinel.list();
      await sentinel.list();
      await sentinel.list();

      expect(initSpy).toBeCalledTimes(1);
    });

    it('throws an init exception at the correct context', async () => {
      sentinel.init = () => {
        throw new Error('Init failed');
      };
      await expect(sentinel.create(createBlockPayload)).rejects.toThrow(/init failed/i);
      expect(sentinel.api).toBe(undefined);
    });
  });

  describe('renew Id token on apiCall throw', () => {
    beforeEach(async () => {
      // Call first so it's not supposed to be called again
      await sentinel.init();
    });

    it('renews token', async () => {
      jest.spyOn(sentinel.api, 'get').mockImplementationOnce(() => {
        return Promise.reject({ response: { status: 401, statusText: 'Unauthorized' } });
      });

      await sentinel.list();
      expect(sentinel.api.get).toBeCalledWith('/subscribers');
      expect(initSpy).toBeCalledTimes(2); // First time and renewal
    });
  });

  describe('list', () => {
    it('calls API correctly', async () => {
      await sentinel.list();
      expect(sentinel.api.get).toBeCalledWith('/subscribers');
      expect(initSpy).toBeCalled();
    });
  });

  describe('create', () => {
    it('passes correct BLOCK type arguments to the API', async () => {
      const { name, network, paused, type, addresses } = createBlockPayload;

      const expectedApiRequest = {
        paused,
        type,
        name,
        network,
        addressRules: [
          {
            abi: undefined,
            addresses: addresses,
            autotaskCondition: undefined,
            conditions: [],
          },
        ],
        alertThreshold: undefined,
        blockWatcherId: 'i-am-the-watcher',
        notifyConfig: {
          autotaskId: undefined,
          notifications: [],
          timeoutMs: 0,
        },
      };

      await sentinel.create(createBlockPayload);
      expect(sentinel.api.post).toBeCalledWith('/subscribers', expectedApiRequest);
      expect(initSpy).toBeCalled();
    });

    it('passes correct FORTA type arguments to the API', async () => {
      const { name, paused, type, addresses, fortaConditions } = createFortaPayload;

      const expectedApiRequest = {
        paused,
        type,
        name,
        alertThreshold: undefined,
        notifyConfig: {
          autotaskId: undefined,
          notifications: [],
          timeoutMs: 0,
        },
        fortaRule: {
          addresses: addresses,
          agentIDs: undefined,
          autotaskCondition: undefined,
          conditions: fortaConditions,
        },
      };

      await sentinel.create(createFortaPayload);
      expect(sentinel.api.post).toBeCalledWith('/subscribers', expectedApiRequest);
      expect(initSpy).toBeCalled();
    });
    it('passes correct Private FORTA type arguments to the API', async () => {
      const { name, paused, type, addresses, fortaConditions } = createFortaPayload;

      const expectedApiRequest = {
        paused,
        type,
        name,
        privateFortaNodeId: '0x123',
        alertThreshold: undefined,
        notifyConfig: {
          autotaskId: undefined,
          notifications: [],
          timeoutMs: 0,
        },
        fortaRule: {
          addresses: addresses,
          agentIDs: undefined,
          autotaskCondition: undefined,
          conditions: fortaConditions,
        },
      };

      await sentinel.create({ ...createFortaPayload, privateFortaNodeId: '0x123' });
      expect(sentinel.api.post).toBeCalledWith('/subscribers', expectedApiRequest);
      expect(initSpy).toBeCalled();
    });
  });

  describe('get', () => {
    it('passes correct arguments to the API', async () => {
      await sentinel.get('i-am-the-watcher');
      expect(sentinel.api.get).toBeCalledWith('/subscribers/i-am-the-watcher');
      expect(initSpy).toBeCalled();
    });
  });

  describe('update', () => {
    it('passes correct BLOCK type arguments to the API', async () => {
      jest.spyOn(sentinel, 'get').mockImplementation(async () => oldBlockSentinel);

      const { name, network, paused, type, addresses } = createBlockPayload;

      const expectedApiRequest = {
        paused,
        type,
        name,
        network,
        addressRules: [
          {
            abi: '[{ method: "type" }]',
            addresses: addresses,
            autotaskCondition: undefined,
            conditions: [],
          },
        ],
        alertThreshold: undefined,
        blockWatcherId: 'i-am-the-watcher',
        notifyConfig: {
          autotaskId: undefined,
          notifications: [],
          timeoutMs: 0,
        },
      };

      const sentinelId = 'i-am-the-BLOCK-watcher';
      await sentinel.update(sentinelId, createBlockPayload);
      expect(sentinel.api.put).toBeCalledWith(`/subscribers/${sentinelId}`, expectedApiRequest);
      expect(initSpy).toBeCalled();
    });

    it('passes correct FORTA type arguments to the API', async () => {
      const oldSentinel: CreateSentinelResponse = {
        type: 'FORTA',
        subscriberId: 'old-subscriber-id',
        name: 'Previous sentinel',
        paused: false,
        network: 'goerli',
        fortaRule: {
          addresses: ['0xdead'],
          conditions: {
            minimumScannerCount: 100,
          },
        },
      };
      jest.spyOn(sentinel, 'get').mockImplementation(async () => oldSentinel);

      const { name, paused, type, addresses, fortaConditions } = createFortaPayload;

      const expectedApiRequest = {
        paused,
        type,
        name,
        alertThreshold: undefined,
        notifyConfig: {
          autotaskId: undefined,
          notifications: [],
          timeoutMs: 0,
        },
        fortaRule: {
          addresses: addresses,
          agentIDs: undefined,
          autotaskCondition: undefined,
          conditions: fortaConditions,
        },
      };

      const sentinelId = 'i-am-the-FORTA-watcher';
      await sentinel.update(sentinelId, createFortaPayload);
      expect(sentinel.api.put).toBeCalledWith(`/subscribers/${sentinelId}`, expectedApiRequest);
      expect(initSpy).toBeCalled();
    });

    it('does not override with nulls or undefined when only passing one argument', async () => {
      jest.spyOn(sentinel, 'get').mockImplementation(async () => oldBlockSentinel);

      const name = 'some random new name';

      const expectedApiRequest = {
        type: oldBlockSentinel.type,
        name,
        addressRules: [
          {
            abi: oldBlockSentinel.addressRules[0].abi,
            addresses: oldBlockSentinel.addressRules[0].addresses,
            autotaskCondition: undefined,
            conditions: [],
          },
        ],
        blockWatcherId: oldBlockSentinel.blockWatcherId,
        network: oldBlockSentinel.network,
        notifyConfig: {
          autotaskId: undefined,
          notifications: [],
          timeoutMs: 0,
        },
        alertThreshold: undefined,
        paused: oldBlockSentinel.paused,
      };

      const sentinelId = 'i-am-the-BLOCK-watcher';
      await sentinel.update(sentinelId, {
        type: 'BLOCK',
        name,
      });
      expect(sentinel.api.put).toBeCalledWith(`/subscribers/${sentinelId}`, expectedApiRequest);
      expect(initSpy).toBeCalled();
    });
  });

  describe('pause', () => {
    it('passes correct arguments to the API', async () => {
      jest.spyOn(sentinel, 'get').mockImplementation(async () => oldBlockSentinel);

      const sentinelId = 'i-am-the-BLOCK-watcher';
      await sentinel.pause(sentinelId);
      expect(sentinel.api.put).toBeCalledWith(
        `/subscribers/${sentinelId}`,
        expect.objectContaining({
          paused: true,
        }),
      );
      expect(initSpy).toBeCalled();
    });
  });

  describe('unpause', () => {
    it('passes correct arguments to the API', async () => {
      jest.spyOn(sentinel, 'get').mockImplementation(async () => oldBlockSentinel);

      const sentinelId = 'i-am-the-BLOCK-watcher';
      await sentinel.unpause(sentinelId);
      expect(sentinel.api.put).toBeCalledWith(
        `/subscribers/${sentinelId}`,
        expect.objectContaining({
          paused: false,
        }),
      );
      expect(initSpy).toBeCalled();
    });
  });

  describe('delete', () => {
    it('passes correct arguments to the API', async () => {
      await sentinel.delete('i-am-the-watcher');
      expect(sentinel.api.delete).toBeCalledWith('/subscribers/i-am-the-watcher');
      expect(initSpy).toBeCalled();
    });
  });

  describe('createNotificationChannel', () => {
    it('passes correct arguments to the API', async () => {
      const type = 'slack';
      const notification: CreateNotificationRequest = {
        type,
        name: 'some test',
        config: {
          url: 'test.slack.com',
        },
        paused: false,
      };
      await sentinel.createNotificationChannel(notification);
      expect(sentinel.api.post).toBeCalledWith(`/notifications/${type}`, notification);
      expect(initSpy).toBeCalled();
    });
  });

  describe('listNotificationChannels', () => {
    it('calls API correctly', async () => {
      listNotificationChannelsSpy.mockRestore();
      await sentinel.listNotificationChannels();
      expect(sentinel.api.get).toBeCalledWith('/notifications');
      expect(initSpy).toBeCalled();
    });
  });

  describe('deleteNotificationChannel', () => {
    it('passes correct arguments to the API', async () => {
      const type = 'slack';
      const notificationId = '1';
      const notification: DeleteNotificationRequest = {
        type,
        notificationId,
      };
      await sentinel.deleteNotificationChannel(notification);
      expect(sentinel.api.delete).toBeCalledWith(`/notifications/${type}/${notification.notificationId}`);
      expect(initSpy).toBeCalled();
    });
  });

  describe('getNotificationChannel', () => {
    it('passes correct arguments to the API', async () => {
      const type = 'slack';
      const notificationId = '1';
      const notification: GetNotificationRequest = {
        type,
        notificationId,
      };
      await sentinel.getNotificationChannel(notification);
      expect(sentinel.api.get).toBeCalledWith(`/notifications/${type}/${notification.notificationId}`);
      expect(initSpy).toBeCalled();
    });
  });

  describe('updateNotificationChannel', () => {
    it('passes correct arguments to the API', async () => {
      const type = 'slack';
      const notificationId = '1';

      const notification: UpdateNotificationRequest = {
        type,
        notificationId,
        name: 'some test',
        config: {
          url: 'test.slack.com',
        },
        paused: false,
      };
      await sentinel.updateNotificationChannel(notification);
      expect(sentinel.api.put).toBeCalledWith(`/notifications/${type}/${notificationId}`, notification);
      expect(initSpy).toBeCalled();
    });
  });

  describe('listBlockwatchers', () => {
    it('calls API correctly', async () => {
      listBlockwatchersSpy.mockRestore();
      await sentinel.listBlockwatchers();
      expect(sentinel.api.get).toBeCalledWith('/blockwatchers');
      expect(initSpy).toBeCalled();
    });
  });

  describe('getBlockwatcherIdByNetwork', () => {
    it('finds blockwatchers for network when there are available', async () => {
      // Make sure the network provided is the network mocked above
      const results = await sentinel.getBlockwatcherIdByNetwork('rinkeby');
      expect(results[0].blockWatcherId).toEqual('i-am-the-watcher');
    });

    it('does not find blockwatchers for network when there are none', async () => {
      const results = await sentinel.getBlockwatcherIdByNetwork('non-supported');
      expect(results).toEqual([]);
    });
  });
});

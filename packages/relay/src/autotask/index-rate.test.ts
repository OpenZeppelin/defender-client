import { AutotaskRelayer } from '.';
import Lambda from 'aws-sdk/clients/lambda';
import { Lambda as LambdaV3 } from '../__mocks__/@aws-sdk/client-lambda';
jest.mock('node:process', () => ({
  ...jest.requireActual('node:process'),
  version: 'v16.0.3',
}));

type TestAutotaskRelayer = Omit<AutotaskRelayer, 'lambda' | 'relayerARN'> & { lambda: Lambda; arn: string };

const getTime = () => Math.floor(Date.now() / 1000);
const sleep = (millisecond: number) => new Promise((resolve) => setTimeout(resolve, millisecond));

const waitNextSecondStart = async () => {
  const startTime = getTime();

  let currentTime = startTime;

  while (startTime === currentTime) {
    await sleep(10);
    currentTime = getTime();
  }

  return true;
};

describe('AutotaskRelayer', () => {
  const credentials = {
    AccessKeyId: 'keyId',
    SecretAccessKey: 'accessKey',
    SessionToken: 'token',
  };

  let relayer: TestAutotaskRelayer;

  beforeEach(async function () {
    jest.mock('aws-sdk/clients/lambda', () => Lambda);
    jest.mock('@aws-sdk/client-lambda', () => ({ Lambda: LambdaV3 }));
    relayer = new AutotaskRelayer({
      credentials: JSON.stringify(credentials),
      relayerARN: 'arn',
    }) as unknown as TestAutotaskRelayer;
  });

  describe('get rate limited', () => {
    test('throw Rate limit error after 300 requests', async () => {
      const rateLimit = 300;

      await waitNextSecondStart();

      let hasBeenRateLimited = false;

      await Promise.all(
        Array.from({ length: 302 }).map(async (ignore, index) => {
          try {
            await relayer.query('42');
          } catch (error: any) {
            expect(index).toBe(rateLimit + 1);
            expect(error.message).toBe('Rate limit exceeded');
            hasBeenRateLimited = true;
          }
        }),
      );

      await sleep(1000);

      const afterTheLimitQueryResult = await relayer.query('42');

      expect(hasBeenRateLimited).toBe(true);
      expect(Boolean(afterTheLimitQueryResult)).toBe(true);
    });
  });
});

import { AutotaskRelayer } from '.';
import Lambda from 'aws-sdk/clients/lambda';

type TestAutotaskRelayer = Omit<AutotaskRelayer, 'lambda' | 'relayerARN'> & { lambda: Lambda; arn: string };

describe('AutotaskRelayer', () => {
  const credentials = {
    AccessKeyId: 'keyId',
    SecretAccessKey: 'accessKey',
    SessionToken: 'token',
  };

  let relayer: TestAutotaskRelayer;

  beforeEach(async function () {
    relayer = new AutotaskRelayer({
      credentials: JSON.stringify(credentials),
      relayerARN: 'arn',
    }) as unknown as TestAutotaskRelayer;
  });

  afterAll(() => {
    expect(true).toBe(false);
  });

  describe('get rate limited', () => {
    test('passes correct arguments to the API', async () => {
      await Promise.all(
        Array.from({ length: 301 }).map(async (ignore, index) => {
          try {
            await relayer.query('42');
          } catch (error) {
            expect(index).toBe(301);
            expect(error.message).toBe('Rate limit exceeded');
          }
        }),
      );
    });
  });
});

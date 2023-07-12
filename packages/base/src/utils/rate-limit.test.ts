import { rateLimitModule } from './rate-limit';

describe('utils/rate-limit', () => {
  test('should throw error if limit is reached', () => {
    try {
      const rateLimit = rateLimitModule.createCounterFor('test1', 2);

      const rateEntryName = 1;

      rateLimit.incrementRateFor(rateEntryName);
      rateLimit.incrementRateFor(rateEntryName);
      rateLimit.incrementRateFor(rateEntryName);

      rateLimit.checkRateFor(rateEntryName);

      fail('Should have errored');
    } catch (error: any) {
      expect(error.message).toBe('Rate limit exceeded');
    }
  });

  test('should increment rate for entry', () => {
    const rateLimit = rateLimitModule.createCounterFor('test2', 2);

    const rateEntryName = 1;

    rateLimit.incrementRateFor(rateEntryName);
    rateLimit.incrementRateFor(rateEntryName);

    expect(rateLimit.getRateFor(rateEntryName)).toBe(2);
  });
});

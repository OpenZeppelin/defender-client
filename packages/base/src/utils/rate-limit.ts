type GlobalCounter = Record<string, Map<unknown, number>>;

const createRateLimitModule = () => {
  const globalCounter: GlobalCounter = {};

  return {
    createCounterFor: (toLimitIdentifier: string, rateLimit: number) => {
      const hasAlreadyACounter = Boolean(globalCounter[toLimitIdentifier]);
      if (!hasAlreadyACounter) globalCounter[toLimitIdentifier] = new Map();

      const rateLimitForIdentifier = globalCounter[toLimitIdentifier];

      if (!rateLimitForIdentifier) throw new Error('Rate limit identifier not found');

      return {
        getRateFor: (rateEntry: unknown) => rateLimitForIdentifier.get(rateEntry) || 0,
        checkRateFor: (rateEntry: unknown) => {
          const currentSecondNumberOfRequests = rateLimitForIdentifier.get(rateEntry) || 0;

          if (currentSecondNumberOfRequests > rateLimit) throw new Error('Rate limit exceeded');

          return currentSecondNumberOfRequests;
        },
        incrementRateFor: (rateEntry: unknown) => {
          const newRateCount = (rateLimitForIdentifier.get(rateEntry) || 0) + 1;
          rateLimitForIdentifier.set(rateEntry, newRateCount);

          return newRateCount;
        },
      };
    },
  };
};

export type RateLimitModule = {
  checkRateFor: (currentTimeStamp: number) => number;
  incrementRateFor: (currentTimeStamp: number) => number;
};

export const rateLimitModule = createRateLimitModule();

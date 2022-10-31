type GlobalCounter = Record<string, Map<unknown, number>>;

const createRateLimitModule = () => {
  const globalCounter: GlobalCounter = {};

  return {
    createCounterFor: (toLimitIdentifier: string, rateLimit: number) => {
      const hasAlreadyACounter = globalCounter[toLimitIdentifier];
      if (!hasAlreadyACounter) globalCounter[toLimitIdentifier] = new Map();

      return {
        checkRateFor: (rateEntry: unknown) => {
          const currentSecondNumberOfRequests = globalCounter[toLimitIdentifier].get(rateEntry) || 0;

          if (currentSecondNumberOfRequests > rateLimit) throw new Error('Too many requests');

          return currentSecondNumberOfRequests;
        },
        incrementRateFor: (rateEntry: unknown) => {
          const newRateCount = (globalCounter[toLimitIdentifier].get(rateEntry) || 0) + 1;
          globalCounter[toLimitIdentifier].set(rateEntry, newRateCount);

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

type AccountUsage =
  | {
      name: string;
      description: string;
      used: number;
      limit: number;
      overage?: number;
      remaining: number;
      period: 'hour' | 'month' | 'total';
    }
  | {
      name: string;
      error: string;
    };

export type AccountUsageResponse = Record<string, AccountUsage>;

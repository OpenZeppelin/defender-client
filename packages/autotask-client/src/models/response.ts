import { Autotask } from './autotask';

export type AutotaskListResponse = {
  items: Autotask[];
  keyValueStoreItemsCount: number;
  runsQuotaUsage: number;
};

import { Autotask } from './autotask';

export type AutotaskListResponse = {
  items: Autotask[];
  keyValueStoreItemsCount: number;
  runsQuotaUsage: number;
};

export type AutotaskGetResponse = Autotask;

export type AutotaskCreateResponse = Autotask;

export type AutotaskDeleteResponse = {
  message: string;
};

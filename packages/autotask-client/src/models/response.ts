import { Autotask } from './autotask';

export type AutotaskListResponse = {
  items: Autotask[];
  keyValueStoreItemsCount: number;
  runsQuotaUsage: number;
};

export type AutotaskResponse = Autotask;

export type AutotaskDeleteResponse = {
  message: string;
};

export type AutotaskMessageResponse = { message: string };

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = T | U extends Record<string, unknown> ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
export type OneOf<T, K extends keyof T> = Omit<T, K> &
  {
    [k in K]: Pick<Required<T>, k> &
      {
        [k1 in Exclude<K, k>]?: never;
      };
  }[K];

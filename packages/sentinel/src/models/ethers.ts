export function isTransactionMethod(fragment: { type: string; constant: boolean }): boolean {
  return fragment.type === 'function' && !fragment.constant;
}

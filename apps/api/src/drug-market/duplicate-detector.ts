export function hasDuplicateKeys(keys: string[]) {
  return new Set(keys).size !== keys.length;
}

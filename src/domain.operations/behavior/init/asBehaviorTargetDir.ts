/**
 * .what = strip .behavior suffix from target directory path
 * .why = users may pass path that ends in .behavior; strip for consistent handling
 */
export const asBehaviorTargetDir = (input: { targetDirRaw: string }): string =>
  input.targetDirRaw.replace(/\/?\.behavior\/?$/, '');

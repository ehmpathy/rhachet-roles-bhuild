import { ConstraintError } from 'helpful-errors';

/**
 * .what = one segment of an os.fileops task path (repo owner, repo name, or exid), checked
 * .why = a drain replays exid, owner, and name from record files; a value with a path
 *        separator or a `..` would climb out of ~/git/.radio, so it is refused before any join
 */
export const asOsFileopsPathSegment = (input: {
  value: string;
  of: 'owner' | 'name' | 'exid';
}): string => {
  // a plain segment: letters, digits, dot, dash, underscore — and never a dot run alone
  const isPlain = /^[A-Za-z0-9._-]+$/.test(input.value);
  const isClimb = input.value.includes('..');
  if (isPlain && !isClimb) return input.value;
  throw new ConstraintError(
    `os.fileops ${input.of} "${input.value}" is not a plain path segment; use letters, digits, dot, dash, or underscore, with no "..", e.g. sandpine`,
    { of: input.of, value: input.value },
  );
};

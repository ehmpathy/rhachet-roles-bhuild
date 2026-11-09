import { isAbsolute, relative, sep } from 'path';

import { asPathAbs } from './asPathAbs';

/**
 * .what = whether a path from cwd climbs above it
 * .why  = a climb is a `..` SEGMENT; a name that merely starts with `..` (`..notes/`) stays inside
 */
const isPathRelClimb = (input: { pathRel: string }): boolean =>
  input.pathRel === '..' || input.pathRel.startsWith(`..${sep}`);

/**
 * .what = whether a path from cwd stays inside cwd
 * .why  = inside means it neither climbs (`..`) nor jumps to another root, which `relative`
 *         returns as an absolute path (another drive, on windows)
 */
const isPathRelInside = (input: { pathRel: string }): boolean =>
  !isPathRelClimb(input) && !isAbsolute(input.pathRel);

/**
 * .what = places a `--vision` path against cwd: its absolute form, its form from cwd, and
 *         whether it stays inside cwd
 * .why  = a name prefix is not containment; only a path from cwd that stays inside is inside
 */
export const asVisionPath = (input: {
  vision: string;
  cwd: string;
}): { pathAbs: string; pathRel: string; isInside: boolean } => {
  const pathAbs = asPathAbs({ path: input.vision, cwd: input.cwd });
  const pathRel = relative(input.cwd, pathAbs);
  return { pathAbs, pathRel, isInside: isPathRelInside({ pathRel }) };
};

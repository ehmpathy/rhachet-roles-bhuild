/**
 * .what = read stone yields off disk for one route
 * .why  = a filter that matches zero files must fail loud: an empty corpus and a clean gate
 *         render identically, so a silent `0 blockers` would be a false pass.
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { ConstraintError } from 'helpful-errors';
import { join } from 'path';

export interface YieldSource {
  path: string;
  lines: string[];
}

/**
 * .what = a yield is `$stone.yield.md` — never an appendix
 * .why  = the appendix is where archaeology BELONGS (`rule.require.archaeology-in-notes`), so a
 *         lint over it would fine the driver for the ejection the lint exists to demand.
 */
const isYieldFile = (input: {
  file: string;
  stone: string | null;
}): boolean => {
  if (!input.file.endsWith('.yield.md')) return false;
  if (input.stone === null) return true;
  return input.file.startsWith(input.stone);
};

/**
 * .what = every `*.yield.md` directly on one route dir
 */
export const getAllYieldsOnRoute = (input: {
  route: string;
  stone: string | null;
}): YieldSource[] => {
  if (!existsSync(input.route))
    ConstraintError.throw('no such route dir', {
      route: input.route,
      hint: 'pass --route as the path to the behavior dir, e.g. .behavior/v2026_01_01.my-feature',
    });

  const found = readdirSync(input.route)
    .filter((file) => isYieldFile({ file, stone: input.stone }))
    .sort()
    .map((file) => asYieldSource({ path: join(input.route, file) }));

  // 🔴 zero matches is a constraint error, never an empty pass. a lint that read no file and
  //    reported `0 blockers` is indistinguishable from a lint every file cleared.
  if (found.length === 0)
    ConstraintError.throw('no stone yield matched on that route', {
      route: input.route,
      stone: input.stone,
      hint: 'a yield is named `$stone.yield.md`; an appendix is not read by this lint',
    });

  return found;
};

const asYieldSource = (input: { path: string }): YieldSource => ({
  path: input.path,
  lines: readFileSync(input.path, 'utf-8').split('\n'),
});

import { join } from 'path';

/**
 * .what = every dir a tree name could live at, one pair per org dir under the git root
 * .why = the crew verbs put a tree at `<gitRoot>/<org>/_worktrees/<tree>`, and a main checkout
 *        sits at `<gitRoot>/<org>/<tree>`; both are checked under each org
 */
export const asPhoneTreeDirCandidates = (input: {
  gitRoot: string;
  orgNames: string[];
  tree: string;
}): string[] =>
  input.orgNames.flatMap((org) => [
    join(input.gitRoot, org, '_worktrees', input.tree),
    join(input.gitRoot, org, input.tree),
  ]);

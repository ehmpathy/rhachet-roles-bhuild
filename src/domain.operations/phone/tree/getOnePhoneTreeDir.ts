import { getAllGitOrgNames } from '@src/infra/git/getAllGitOrgNames';
import { isGitRepoAt } from '@src/infra/git/isGitRepoAt';

import type { PhoneContext } from '../PhoneContext';
import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { asPhoneTreeDirCandidates } from './asPhoneTreeDirCandidates';

/**
 * .what = finds the dir a tree name names on this grove, or null if no tree answers
 * .why = a tree is named by its dir name alone, unique on its grove (A1); the phone looks it up
 *        where the crew verbs put trees: `<gitRoot>/<org>/_worktrees/<tree>`, or a main checkout
 *        at `<gitRoot>/<org>/<tree>`
 *
 * .note = two dirs that answer one name are refused, never guessed: a text must reach one tree
 */
export const getOnePhoneTreeDir = async (
  input: { tree: string; treeDirSelf: string; treeSelf: string },
  context: Pick<PhoneContext, 'gitRoot'>,
): Promise<string | null> => {
  // a clone's own tree is known without a search
  if (input.tree === input.treeSelf) return input.treeDirSelf;

  // search each org dir for a worktree or a main checkout of that name
  const candidates = asPhoneTreeDirCandidates({
    gitRoot: context.gitRoot,
    orgNames: await getAllGitOrgNames({ gitRoot: context.gitRoot }),
    tree: input.tree,
  });
  const found = candidates.filter((dir) => isGitRepoAt({ dir }));

  // one answer, none, or a refusal for two
  if (found.length <= 1) return found[0] ?? null;
  throw genPhoneRefusal({
    vibe: 'bummer, two trees answer to that name',
    headline: `tree ${input.tree} names ${found.length} dirs on this grove`,
    nodes: [
      { text: 'dirs', children: found.map((dir) => ({ text: dir })) },
      { text: 'a tree name must be unique on its grove; rename one of them' },
    ],
  });
};

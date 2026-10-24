import { getOneGitTreeDirOfCwd } from '@src/infra/git/getOneGitTreeDirOfCwd';

import { genPhoneRefusal } from '../render/genPhoneRefusal';

/**
 * .what = the root dir of the git tree this verb runs in, or a refusal when it runs in none
 * .why = the phone keys its mailbox, contacts, meter, and daemon to the tree a verb runs in
 */
export const getOnePhoneTreeDirOfCwd = (): string => {
  const treeDir = getOneGitTreeDirOfCwd();
  if (treeDir) return treeDir;
  throw genPhoneRefusal({
    vibe: 'bummer, no tree here',
    headline: `${process.cwd()} is not inside a git tree`,
    nodes: [{ text: 'the phone runs inside a tree; cd into one' }],
  });
};

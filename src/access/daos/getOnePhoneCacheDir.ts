import { join } from 'path';

/**
 * .what = the dispatcher's cache root inside a tree
 * .why = the mailbox, contacts, and daemon daos each keep a `skill=phone.*` dir under one root;
 *        the root lives here, owned by none of them, so no dao reaches into another dao
 */
export const getOnePhoneCacheDir = (input: { treeDir: string }): string =>
  join(input.treeDir, '.agent', '.cache', 'repo=bhuild', 'role=dispatcher');

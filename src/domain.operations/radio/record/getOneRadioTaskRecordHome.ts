import { join, relative } from 'path';

/**
 * .what = the dir a push records into
 * .why = the route that pushed holds its own ledger; a push with no single
 *        bound route still records, beside the routes, so no task is dropped
 *
 * .note = the caller supplies the branch's route bind (null outside a git repo),
 *         so the radio context depends on the bind's shape alone, never on how
 *         the behavior context discovers it.
 *         place 'route'  = $route/.radio/ (one route bound to the branch)
 *         place 'unbound' = .behavior/.radio/ (no route bound, or no git)
 *         place 'multibound' = .behavior/.radio/ (two or more routes bound)
 */
export const getOneRadioTaskRecordHome = (
  input: { bind: { behaviorDir: string | null; binds: string[] } | null },
  context: { cwd: string },
): {
  dir: string;
  place: 'route' | 'unbound' | 'multibound';
  binds: string[];
} => {
  // outside a git repo, no branch can bind a route
  const dirUnbound = join(context.cwd, '.behavior', '.radio');
  if (!input.bind) return { dir: dirUnbound, place: 'unbound', binds: [] };

  // one route bound to this branch: it holds the ledger
  const binds = input.bind.binds.map((dir) => relative(context.cwd, dir));
  if (input.bind.behaviorDir)
    return {
      dir: join(input.bind.behaviorDir, '.radio'),
      place: 'route',
      binds,
    };

  // no single route: hold beside the routes
  if (binds.length > 1) return { dir: dirUnbound, place: 'multibound', binds };
  return { dir: dirUnbound, place: 'unbound', binds };
};

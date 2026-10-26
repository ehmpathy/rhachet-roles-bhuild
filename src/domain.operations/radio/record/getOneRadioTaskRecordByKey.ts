import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { getAllRadioTaskRecordDirs } from './getAllRadioTaskRecordDirs';

/**
 * .what = code-unit order of two dir paths
 * .why = a locale-free order reads the same on every machine
 */
const asCodeUnitOrderOfDirs = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

/**
 * .what = the extant record for a push identity, with the dir it lives in: the home first, then any
 *         other record dir of the worktree
 * .why = a push held while the branch was unbound lives in `.behavior/.radio/`; after a route bind,
 *        the home moves to `$route/.radio/`. a re-push must still find its record there, or it
 *        writes a second record for one task, and the queue shows it twice
 *
 * .note = dirHome null = no home to prefer: `queue set` and `queue del` name a record by the
 *         key `queue get` prints. where two other dirs hold one key, the dir first in code-unit
 *         order answers, so a repeat of the verb acts on the same record on every run and machine
 */
export const getOneRadioTaskRecordByKey = (
  input: { key: string; dirHome: string | null },
  context: { cwd: string },
): { record: RadioTaskRecord; dir: string } | null => {
  // the home dir answers first, when there is one
  const atHome = input.dirHome
    ? daoRadioTaskRecord.get.one.byUnique({
        dir: input.dirHome,
        key: input.key,
      })
    : null;
  if (atHome && input.dirHome) return { record: atHome, dir: input.dirHome };

  // else the first other record dir that holds it, in a pinned order (never the readdir order)
  const [found] = getAllRadioTaskRecordDirs({}, context)
    .filter((dir) => dir !== input.dirHome)
    .sort(asCodeUnitOrderOfDirs)
    .flatMap((dir) => {
      const record = daoRadioTaskRecord.get.one.byUnique({
        dir,
        key: input.key,
      });
      return record ? [{ record, dir }] : [];
    });
  return found ?? null;
};

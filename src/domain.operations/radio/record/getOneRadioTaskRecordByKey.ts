import { daoRadioTaskRecord } from '@src/access/daos/daoRadioTaskRecord';
import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { getAllRadioTaskRecordDirs } from './getAllRadioTaskRecordDirs';

/**
 * .what = the extant record for a push identity, with the dir it lives in: the home first, then any
 *         other record dir of the worktree
 * .why = a push held while the branch was unbound lives in `.behavior/.radio/`; after a route bind,
 *        the home moves to `$route/.radio/`. a re-push must still find its record there, or it
 *        writes a second record for one task, and the queue shows it twice
 *
 * .note = dirHome null = no home to prefer: `queue set` and `queue del` name a record by the
 *         key `queue get` prints, from whichever record dir holds it
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

  // else the first other record dir that holds it
  const [found] = getAllRadioTaskRecordDirs({}, context)
    .filter((dir) => dir !== input.dirHome)
    .flatMap((dir) => {
      const record = daoRadioTaskRecord.get.one.byUnique({
        dir,
        key: input.key,
      });
      return record ? [{ record, dir }] : [];
    });
  return found ?? null;
};

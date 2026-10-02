import { createHash } from 'crypto';

import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import type { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';

/**
 * .what = the identity of a push, as a file-safe key
 * .why = a repeat push must land on its extant record, never a second one.
 *        a create is keyed (repo, title) — the identity RadioTask.unique declares;
 *        an update is keyed (repo, exid, status)
 */
export const asRadioTaskRecordKey = (input: {
  repo: RadioTaskRepo;
  title: string | null;
  exid: string | null;
  status: RadioTaskStatus | null;
}): string => {
  const repoSlug = asRadioTaskRepoSlug({ repo: input.repo });
  const identity =
    input.exid === null
      ? ['create', repoSlug, input.title ?? ''].join('\n')
      : ['update', repoSlug, input.exid, input.status ?? ''].join('\n');
  return createHash('sha256').update(identity).digest('hex').slice(0, 16);
};

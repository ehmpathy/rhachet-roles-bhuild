import { createHash } from 'crypto';

import type { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { asCommentBodyCompared } from '@src/domain.operations/radio/task/comment/asCommentBodyCompared';

import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';

/**
 * .what = the identity of a comment, as a file-safe key
 * .why = a repeat of one body on one thread lands on its extant record; a new body on that
 *        thread is its own record. the body enters by hash, so a long body never bloats the key
 *
 * .note = the `comment` lead word sets this identity apart from a create or an update
 *         (asRadioTaskRecordKey), so no push can collide with a comment
 * .note = the body is hashed in the form the thread match reads (asCommentBodyCompared), so
 *         `x` and `x\n` are one comment to the record as they are to the thread
 */
export const asRadioTaskRecordKeyOfComment = (input: {
  repo: RadioTaskRepo;
  exid: string;
  body: string;
}): string => {
  const bodyHash = createHash('sha256')
    .update(asCommentBodyCompared({ body: input.body }))
    .digest('hex');
  const identity = [
    'comment',
    asRadioTaskRepoSlug({ repo: input.repo }),
    input.exid,
    bodyHash,
  ].join('\n');
  return createHash('sha256').update(identity).digest('hex').slice(0, 16);
};

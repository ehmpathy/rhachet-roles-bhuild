import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioPromiseHoldReason } from '../promise/isRadioPromiseHoldReason';
import { asRadioAuthShown } from './asRadioAuthShown';
import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';
import { isRadioTaskRecordTextUnvouched } from './isRadioTaskRecordTextUnvouched';

/**
 * .what = the last line of an amend: when the amended record goes out
 * .why = a record held for its promise, or one whose promise the amend just cleared, goes out
 *        only on `drain --promise`; a plain drain holds it again, so the footer must not say
 *        a plain drain sends it
 * .note = a record held for another reason (a shut gate, an upstream fault) whose text goes to
 *         gh.issues with no promise may still go to a public repo; the amend reads no visibility,
 *         so its footer names the vouch as the condition, never the plain drain alone
 */
const asFooter = (input: {
  before: RadioTaskRecord;
  after: RadioTaskRecord;
}): string => {
  const { before, after } = input;
  const isAwaitsVouch =
    isRadioPromiseHoldReason(after.reason) ||
    (before.promise !== null && after.promise === null);
  if (isAwaitsVouch)
    return 'naught sent; its place in line is kept, and it sends only with `rhx radio.task.queue drain --promise task-to-public-repo-is-anonymized`, once checked';
  if (isRadioTaskRecordTextUnvouched({ record: after }))
    return 'naught sent; its place in line is kept, and the next push, or `rhx radio.task.queue drain`, sends it; a public repo needs `drain --promise task-to-public-repo-is-anonymized`, once checked';
  return 'naught sent; its place in line is kept, and the next push, or `rhx radio.task.queue drain`, sends it';
};

/**
 * .what = the stdout of `radio.task.queue set`: which fields changed, before → after
 * .why = an amend sends naught, so the output must say what it changed and when it lands
 */
export const asRadioAmendOutput = (input: {
  before: RadioTaskRecord;
  after: RadioTaskRecord;
  path: string;
}): string => {
  const { before, after } = input;
  const changes = [
    ...(before.auth !== after.auth
      ? // each side shows through asRadioAuthShown: a stored auth may be a planted shx(...) text,
        // and no stored auth names the default it resolves to
        [
          `auth: ${asRadioAuthShown({ auth: before.auth })} → ${asRadioAuthShown({ auth: after.auth })}`,
        ]
      : []),
    ...(before.description !== after.description
      ? ['description: amended']
      : []),
    ...(before.promise !== null && after.promise === null
      ? [
          'promise: cleared (it vouched for the old body); a public repo holds the new one until `drain --promise`',
        ]
      : []),
  ];
  return [
    '🦫 amended the held record',
    ...asRadioTreeLines({
      branches: [
        { line: `uuid    = ${after.key}`, children: [] },
        {
          line: `task    = ${asRadioTaskRecordLabel({ record: after })} → ${asRadioTaskRepoSlug({ repo: after.repo })}`,
          children: [],
        },
        {
          line: changes.length ? 'changed' : 'changed naught',
          children: changes,
        },
        // the amended body is not echoed; the path is where to read it whole
        { line: `kept at = ${input.path}`, children: [] },
        { line: asFooter({ before, after }), children: [] },
      ],
    }),
  ].join('\n');
};

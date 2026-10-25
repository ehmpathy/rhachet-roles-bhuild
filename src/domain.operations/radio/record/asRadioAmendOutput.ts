import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';

/**
 * .what = the stdout of `radio.task.queue set`: which fields changed, before → after
 * .why = an amend sends naught, so the output must say what it changed and when it lands
 */
export const asRadioAmendOutput = (input: {
  before: RadioTaskRecord;
  after: RadioTaskRecord;
}): string => {
  const { before, after } = input;
  const changes = [
    ...(before.auth !== after.auth
      ? [`auth: ${before.auth ?? '(default)'} → ${after.auth ?? '(default)'}`]
      : []),
    ...(before.description !== after.description
      ? ['description: amended']
      : []),
  ];
  return [
    '🦫 amended the held record',
    ...asRadioTreeLines({
      branches: [
        { line: `key     = ${after.key}`, children: [] },
        {
          line: `task    = ${asRadioTaskRecordLabel({ record: after })} → ${asRadioTaskRepoSlug({ repo: after.repo })}`,
          children: [],
        },
        {
          line: changes.length ? 'changed' : 'changed naught',
          children: changes,
        },
        {
          line: 'naught sent; its place in line is kept, and the next push or `rhx radio.task.queue drain` sends it',
          children: [],
        },
      ],
    }),
  ].join('\n');
};

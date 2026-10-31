import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioAuthShown } from './asRadioAuthShown';
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
        {
          line: 'naught sent; its place in line is kept, and the next push, or `rhx radio.task.queue drain`, sends it',
          children: [],
        },
      ],
    }),
  ].join('\n');
};

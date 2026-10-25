import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';

/**
 * .what = the stdout of `radio.task.queue del`
 * .why = a drop must say what left the queue, why, and where its words are still kept
 */
export const asRadioDropOutput = (input: {
  record: RadioTaskRecord;
  path: string;
}): string =>
  [
    '🦫 dropped from the radio, never sent',
    ...asRadioTreeLines({
      branches: [
        { line: `key     = ${input.record.key}`, children: [] },
        {
          line: `task    = ${asRadioTaskRecordLabel(input)} → ${asRadioTaskRepoSlug({ repo: input.record.repo })}`,
          children: [],
        },
        { line: `why     = ${input.record.reason}`, children: [] },
        { line: `kept at = ${input.path}`, children: [] },
        {
          line: 'a re-push of the same task queues it again',
          children: [],
        },
      ],
    }),
  ].join('\n');

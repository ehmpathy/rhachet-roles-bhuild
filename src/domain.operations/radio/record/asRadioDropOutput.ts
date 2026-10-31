import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordLabel } from './asRadioTaskRecordLabel';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';

/**
 * .what = the stdout of `radio.task.queue del`
 * .why = a drop must say what left the queue, why, and where its words are still kept; and
 *        when later updates to the same issue waited behind it, that they now go
 */
export const asRadioDropOutput = (input: {
  record: RadioTaskRecord;
  path: string;
  behind: number;
  deliverNeedsClaim: RadioTaskRecord | null;
  isAlreadyDropped: boolean;
}): string => {
  const behindBranches = input.behind
    ? [
        {
          line:
            input.behind === 1
              ? `1 update to #${input.record.exid} waits behind it; it sends next drain`
              : `${input.behind} updates to #${input.record.exid} wait behind it; they send next drain`,
          children: [],
        },
      ]
    : [];

  // a deliver behind a dropped claim is refused for good unless the issue is claimed already
  const deliver = input.deliverNeedsClaim;
  const claimBranches = deliver
    ? [
        {
          line: `⚠️ the deliver of #${input.record.exid} behind it needs a claim; if #${input.record.exid} is not claimed upstream, the next drain refuses it for good`,
          children: [
            `re-push the claim: rhx radio.task.push --via ${input.record.via} --into ${asRadioTaskRepoSlug({ repo: input.record.repo })} --exid ${input.record.exid} --status CLAIMED`,
            `or drop the deliver too: rhx radio.task.queue del --uuid ${deliver.key} --why "its claim was dropped"`,
          ],
        },
      ]
    : [];

  // a retry of a drop: naught changed, the first why stands, and the claim alert still shows
  if (input.isAlreadyDropped)
    return [
      '🦫 already dropped, never sent; naught changed',
      ...asRadioTreeLines({
        branches: [
          { line: `uuid    = ${input.record.key}`, children: [] },
          { line: `why     = ${input.record.reason} (kept)`, children: [] },
          { line: `kept at = ${input.path}`, children: [] },
          ...behindBranches,
          ...claimBranches,
        ],
      }),
    ].join('\n');

  return [
    '🦫 dropped from the radio, never sent',
    ...asRadioTreeLines({
      branches: [
        { line: `uuid    = ${input.record.key}`, children: [] },
        {
          line: `task    = ${asRadioTaskRecordLabel(input)} → ${asRadioTaskRepoSlug({ repo: input.record.repo })}`,
          children: [],
        },
        { line: `why     = ${input.record.reason}`, children: [] },
        { line: `kept at = ${input.path}`, children: [] },
        ...behindBranches,
        ...claimBranches,
        {
          line: 'a re-push of the same task queues it again',
          children: [],
        },
      ],
    }),
  ].join('\n');
};

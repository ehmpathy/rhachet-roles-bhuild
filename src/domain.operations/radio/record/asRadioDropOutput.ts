import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { asRadioTaskRecordSubjectLine } from './asRadioTaskRecordSubjectLine';
import { asRadioTaskRepoSlug } from './asRadioTaskRepoSlug';
import { asRadioTreeLines } from './asRadioTreeLines';

/**
 * .what = the line that names what waits behind a dropped record on its issue
 * .why = it names only the kinds that wait: updates alone keep their own words, comments alone
 *        read as comments, and only a mix says "updates or comments"
 */
const asBehindLine = (input: {
  record: RadioTaskRecord;
  behind: number;
  behindComments: number;
}): string => {
  const isOne = input.behind === 1;
  const kinds = (() => {
    if (input.behindComments === 0)
      return isOne ? '1 update to' : `${input.behind} updates to`;
    if (input.behindComments === input.behind)
      return isOne ? '1 comment on' : `${input.behind} comments on`;
    return `${input.behind} updates or comments on`;
  })();
  return isOne
    ? `${kinds} #${input.record.exid} waits behind it; it sends next drain`
    : `${kinds} #${input.record.exid} wait behind it; they send next drain`;
};

/**
 * .what = the stdout of `radio.task.queue del`
 * .why = a drop must say what left the queue, why, and where its words are still kept; and
 *        when later updates to the same issue waited behind it, that they now go
 */
export const asRadioDropOutput = (input: {
  record: RadioTaskRecord;
  path: string;
  behind: number;
  behindComments: number;
  deliverNeedsClaim: RadioTaskRecord | null;
  isAlreadyDropped: boolean;
}): string => {
  const behindBranches = input.behind
    ? [{ line: asBehindLine(input), children: [] }]
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
          line: `${asRadioTaskRecordSubjectLine(input)} → ${asRadioTaskRepoSlug({ repo: input.record.repo })}`,
          children: [],
        },
        { line: `why     = ${input.record.reason}`, children: [] },
        { line: `kept at = ${input.path}`, children: [] },
        ...behindBranches,
        ...claimBranches,
        {
          line:
            input.record.kind === 'comment'
              ? 'a re-run of the same comment queues it again'
              : 'a re-push of the same task queues it again',
          children: [],
        },
      ],
    }),
  ].join('\n');
};

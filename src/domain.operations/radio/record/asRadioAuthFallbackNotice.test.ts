import { asIsoDateStamp } from 'iso-time';
import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTask } from '@src/domain.objects/RadioTask';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';
import { asRadioAuthBotMiss } from '@src/domain.operations/radio/auth/asRadioAuthBotMiss';
import type { RadioAuthFallback } from '@src/domain.operations/radio/auth/RadioAuthFallback';

import { asRadioAuthFallbackNotice } from './asRadioAuthFallbackNotice';
import type { RadioTaskRecordFate } from './RadioTaskRecordFate';

const repo = new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' });

/**
 * .what = a delivered fate for one surf-school task, with or without a fallback
 * .why = the notice reads only the fate and its fallback
 */
const genDelivered = (input: {
  key: string;
  fallback: RadioAuthFallback | null;
}): RadioTaskRecordFate => ({
  fate: 'delivered',
  record: new RadioTaskRecord({
    key: input.key,
    kind: 'create',
    repo,
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: `lesson reminder ${input.key}`,
    description: 'remind the surfer',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.DELIVERED,
    reason: null,
    heldSeq: 1,
    deliveredExid: '7',
  }),
  task: new RadioTask({
    exid: '7',
    title: `lesson reminder ${input.key}`,
    description: 'remind the surfer',
    status: RadioTaskStatus.QUEUED,
    repo,
    pushedBy: 'bert',
    pushedAt: asIsoDateStamp('2026-11-07'),
    claimedBy: null,
    claimedAt: null,
    deliveredAt: null,
    branch: null,
  }),
  outcome: 'created',
  fallback: input.fallback,
});

const viaLoginAbsent: RadioAuthFallback = {
  kind: 'gh login',
  bot: asRadioAuthBotMiss({
    fault: { message: 'github auth via keyrack failed: X (status: absent)' },
  }),
};
const viaEnvRefused: RadioAuthFallback = {
  kind: 'GITHUB_TOKEN env',
  bot: asRadioAuthBotMiss({ refusal: 'upstream:401' }),
};

describe('asRadioAuthFallbackNotice', () => {
  given('[case1] every record delivered under the bot token', () => {
    when('[t0] the notice is read', () => {
      const lines = asRadioAuthFallbackNotice({
        fates: [genDelivered({ key: 'a', fallback: null })],
      });

      then('there is no line', () => {
        expect(lines).toEqual([]);
      });
    });
  });

  given('[case2] two records delivered via the gh login, bot absent', () => {
    when('[t0] the notice is read', () => {
      const lines = asRadioAuthFallbackNotice({
        fates: [
          genDelivered({ key: 'a', fallback: viaLoginAbsent }),
          genDelivered({ key: 'b', fallback: viaLoginAbsent }),
        ],
      });

      then('one line names the kind and the reason', () => {
        expect(lines).toEqual([
          '🦫 delivered via the gh login; the ehmpath bot token was absent',
        ]);
      });
    });
  });

  given('[case3] one record per distinct (kind, reason)', () => {
    when('[t0] the notice is read', () => {
      const lines = asRadioAuthFallbackNotice({
        fates: [
          genDelivered({ key: 'a', fallback: viaLoginAbsent }),
          genDelivered({ key: 'b', fallback: null }),
          genDelivered({ key: 'c', fallback: viaEnvRefused }),
        ],
      });

      then('each pair gets one line, in first-seen order', () => {
        expect(lines).toEqual([
          '🦫 delivered via the gh login; the ehmpath bot token was absent',
          '🦫 delivered via the GITHUB_TOKEN env; github refused the ehmpath bot token (401)',
        ]);
      });

      then('no line holds a token value', () => {
        expect(lines.join('\n')).not.toMatch(/gh[pos]_/);
      });
    });
  });

  given('[case4] a record delivered via the gh login, bot token locked', () => {
    when('[t0] the notice is read', () => {
      const lines = asRadioAuthFallbackNotice({
        fates: [
          genDelivered({
            key: 'a',
            fallback: {
              kind: 'gh login',
              bot: asRadioAuthBotMiss({
                fault: {
                  message: 'github auth via keyrack failed: X (status: locked)',
                },
              }),
            },
          }),
        ],
      });

      then('the line names the true status, never absent', () => {
        expect(lines).toEqual([
          '🦫 delivered via the gh login; the ehmpath bot token was locked',
        ]);
      });
    });
  });
});

import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

import { asRadioDrainHeldRow } from './asRadioDrainHeldRow';
import { asRadioFaultMessageUnderFallback } from './asRadioFaultMessageUnderFallback';

const genRecord = (input: Partial<RadioTaskRecord>): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'tide chart refresh',
    description: 'pull the new swell table',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: null,
    heldSeq: 1,
    deliveredExid: null,
    ...input,
  });

describe('asRadioDrainHeldRow', () => {
  given(
    '[case1] a drain holds a record on a fault after it fell back to the ambient credential (#513)',
    () => {
      const STATES = ['absent', 'locked', 'blocked', 'not granted'] as const;
      STATES.map((state) =>
        when(`[t${STATES.indexOf(state)}] the bot token was ${state}`, () => {
          const row = asRadioDrainHeldRow({
            fate: {
              fate: 'held',
              record: genRecord({ reason: 'upstream:not-found' }),
              lift: null,
              detail: asRadioFaultMessageUnderFallback({
                message:
                  'HTTP 404: Not Found (https://api.github.com/repos/sandpine/svc-lessons/issues)',
                sentUnder: {
                  kind: 'GITHUB_TOKEN env',
                  bot: {
                    reason: state,
                    headline: `github auth via keyrack failed: EHMPATH_BEAVER_GITHUB_TOKEN (status: ${state})`,
                    fix: 'rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep',
                  },
                },
              }),
              halt: false,
            },
            authOverride: null,
          });

          then(
            'the fault row names the credential sent under, and the state',
            () => {
              expect(row).toContain(
                `fault: sent via the GITHUB_TOKEN env (the ehmpath bot token was ${state}): HTTP 404: Not Found`,
              );
              expect(row).toMatchSnapshot();
            },
          );
        }),
      );
    },
  );
});

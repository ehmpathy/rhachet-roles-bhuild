import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import type { RadioPushArgs } from '../cli/RadioPushArgs';
import { asRadioPromiseHoldDetail } from '../promise/asRadioPromiseHoldDetail';
import { asRadioPromiseNudgeOutput } from './asRadioPromiseNudgeOutput';

const LITERAL = 'task-to-public-repo-is-anonymized';
const recordPath = '.behavior/.radio/record.a1b2c3d4e5f60718.json';

const genRecord = (overrides: Partial<RadioTaskRecord>): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'create',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: 'lesson reminder flakes',
    description: 'the 9am reminder sends twice',
    exid: null,
    status: null,
    recordStatus: RadioTaskRecordStatus.DROPPED,
    reason: 'public-repo:unpromised',
    heldSeq: 1,
    deliveredExid: null,
    promise: null,
    ...overrides,
  });

const argsCreate: RadioPushArgs = {
  via: 'gh.issues',
  into: 'sandpine/svc-lessons',
  exid: null,
  status: null,
  title: 'lesson reminder flakes',
  description: 'the 9am reminder sends twice',
  idem: null,
  auth: null,
};

describe('asRadioPromiseNudgeOutput', () => {
  given('[case1] a create into a public repo, no promise', () => {
    when('[t0] the nudge renders', () => {
      const output = asRadioPromiseNudgeOutput({
        reason: 'public-repo:unpromised',
        detail: null,
        record: genRecord({}),
        recordPath,
        args: argsCreate,
        behind: 0,
        deliverNeedsClaim: false,
        backlogBranches: [],
      });
      then('it names the repo, the checklist, and the command last', () => {
        expect(output).toContain(
          '🦫 hold up — this task goes to a public repo',
        );
        expect(output).toContain('repo: sandpine/svc-lessons (public)');
        expect(output.split('\n').at(-1)).toEqual(
          `rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --title 'lesson reminder flakes' --description 'the 9am reminder sends twice' --promise ${LITERAL}`,
        );
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case2] a multi-line body', () => {
    when('[t0] the nudge renders', () => {
      const body = 'line one\nline two';
      const output = asRadioPromiseNudgeOutput({
        reason: 'public-repo:unpromised',
        detail: null,
        record: genRecord({ description: body }),
        recordPath,
        args: { ...argsCreate, description: body },
        behind: 0,
        deliverNeedsClaim: false,
        backlogBranches: [],
      });
      then('the command prints flush-left, no rail inside the body', () => {
        const lines = output.split('\n');
        expect(lines.at(-1)).toEqual(`line two' --promise ${LITERAL}`);
        expect(lines.at(-2)?.startsWith('rhx radio.task.push')).toBe(true);
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] a visibility read that failed on the auth', () => {
    when('[t0] the nudge renders', () => {
      const output = asRadioPromiseNudgeOutput({
        reason: 'public-repo:unreadable-auth',
        detail: asRadioPromiseHoldDetail({
          reason: 'public-repo:unreadable-auth',
          cause:
            'github auth failed: the robot token was rejected by github (401)',
        }),
        record: genRecord({ reason: 'public-repo:unreadable-auth' }),
        recordPath,
        args: argsCreate,
        behind: 0,
        deliverNeedsClaim: false,
        backlogBranches: [],
      });
      then(
        'it leads with the as-human re-run, and its command has no promise',
        () => {
          expect(output).toContain('may go to a public repo');
          expect(output).toContain('first: re-run with --auth as-human');
          expect(output.split('\n').at(-1)).toContain('--auth as-human');
          expect(output.split('\n').at(-1)).not.toContain('--promise');
          expect(output).toMatchSnapshot();
        },
      );
      then(
        'the repo line holds the claim alone; the cause is its own line',
        () => {
          const lines = output.split('\n');
          const repoLine = lines.find((line) => line.includes('repo: ')) ?? '';
          expect(repoLine).toContain(
            '(visibility unreadable on this auth — try as-human)',
          );
          expect(repoLine).not.toContain('401');
          expect(output).toContain(
            '└─ cause: github auth failed: the robot token was rejected by github (401)',
          );
        },
      );
    });
  });

  given('[case4] a status push whose record carries an earlier body', () => {
    when('[t0] the nudge renders', () => {
      const output = asRadioPromiseNudgeOutput({
        reason: 'public-repo:unpromised',
        detail: null,
        record: genRecord({
          kind: 'update',
          title: null,
          exid: '5',
          status: RadioTaskStatus.CLAIMED,
          description: 'an earlier body',
        }),
        recordPath,
        args: {
          ...argsCreate,
          title: null,
          description: null,
          exid: '5',
          status: 'CLAIMED',
        },
        behind: 1,
        deliverNeedsClaim: true,
        backlogBranches: [],
      });
      then(
        'it names the record path, the status-alone route, and re-pipes the body',
        () => {
          expect(output).toContain(`at ${recordPath}`);
          expect(output).toContain('a --promise here cannot vouch it');
          expect(output).toContain('to send status alone');
          expect(output).toContain(
            '1 update waits behind it on #5; its deliver needs this claim first',
          );
          expect(output.split('\n').at(-1)).toContain('--description @stdin');
          expect(output).toMatchSnapshot();
        },
      );
    });
  });

  given('[case6] a deliver that carries a note', () => {
    when('[t0] the nudge renders', () => {
      const output = asRadioPromiseNudgeOutput({
        reason: 'public-repo:unpromised',
        detail: null,
        record: genRecord({
          kind: 'update',
          title: null,
          exid: '5',
          status: RadioTaskStatus.DELIVERED,
          description: 'shipped the size chart',
        }),
        recordPath,
        args: {
          ...argsCreate,
          title: null,
          description: 'shipped the size chart',
          exid: '5',
          status: 'DELIVERED',
        },
        behind: 0,
        deliverNeedsClaim: false,
        backlogBranches: [],
      });
      then('it names the status-only way out, and says naught was sent', () => {
        expect(output).toContain(
          'to send status alone: re-run it without --description',
        );
        expect(output).toContain('naught sent, naught queued');
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case7] a create, with no status', () => {
    when('[t0] the nudge renders', () => {
      const output = asRadioPromiseNudgeOutput({
        reason: 'public-repo:unpromised',
        detail: null,
        record: genRecord({}),
        recordPath,
        args: argsCreate,
        behind: 0,
        deliverNeedsClaim: false,
        backlogBranches: [],
      });
      then('it offers no status-only way out', () => {
        expect(output).not.toContain('to send status alone');
      });
    });
  });

  given('[case5] a nudge after a drain that carried a backlog', () => {
    when('[t0] the nudge renders', () => {
      const output = asRadioPromiseNudgeOutput({
        reason: 'public-repo:unpromised',
        detail: null,
        record: genRecord({}),
        recordPath,
        args: { ...argsCreate, description: '@stdin' },
        behind: 0,
        deliverNeedsClaim: false,
        backlogBranches: [
          { line: 'delivered', children: ['wetsuit reorder → #41'] },
          { line: 'backlog = 0', children: [] },
        ],
      });
      then('the backlog shows first, then the nudge, the command last', () => {
        expect(output.startsWith('🌊 the backlog')).toBe(true);
        expect(output).toContain(
          're-pipe the checked body into the command below',
        );
        expect(output.split('\n').at(-1)).toContain('--description @stdin');
        expect(output).toMatchSnapshot();
      });
    });
  });
});

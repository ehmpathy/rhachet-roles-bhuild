import { getError, given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';
import { getGithubTokenByAuthArg } from '@src/domain.operations/radio/auth/getGithubTokenByAuthArg';

import { asRadioQueueFixLines } from './asRadioQueueFixLines';

const genRecord = (input: { reason: string | null }): RadioTaskRecord =>
  new RadioTaskRecord({
    key: 'a1b2c3d4e5f60718',
    kind: 'update',
    repo: new RadioTaskRepo({ owner: 'sandpine', name: 'svc-lessons' }),
    via: RadioChannel.GH_ISSUES,
    auth: null,
    idem: null,
    title: null,
    description: 'board rentals open friday',
    exid: '599',
    status: null,
    recordStatus: RadioTaskRecordStatus.QUEUED,
    reason: input.reason,
    heldSeq: 1,
    deliveredExid: null,
  });

// the auth a case's record holds unless it names its own: a robot value, the shape #599 met
const AUTH_ROBOT = 'as-robot:via-keyrack(ehmpath)';

const AMEND =
  'amend it: rhx radio.task.queue set --uuid a1b2c3d4e5f60718 --auth as-human (needs a gh login on this host)';
const AMEND_DEFAULT = [
  'amend it to the robot: rhx radio.task.queue set --uuid a1b2c3d4e5f60718 --auth as-ehmpath-via-keyrack',
  'or, to send as yourself, check the gh login on this host: gh auth status (else: gh auth login), then: rhx radio.task.queue drain',
];
const DROP =
  'or drop it: rhx radio.task.queue del --uuid a1b2c3d4e5f60718 --why "<why>"';

const FIX_CASES = [
  {
    description: 'an access fault names amend + drop (the #599 shape)',
    given: { reason: 'upstream:access' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description: 'a repo the auth cannot see names amend + drop',
    given: { reason: 'upstream:not-found' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description: 'a rejected token names amend + drop (#513)',
    given: { reason: 'upstream:401' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description: 'an auth not derivable names amend + drop',
    given: { reason: 'upstream:auth' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description:
      'an unknown fault read back by get names the drain that prints it again, then drop; no auth is known to cure it',
    given: { reason: 'upstream:fault' },
    expect: {
      output: [
        'retry it and print its fault: rhx radio.task.queue drain (this sends every held record whose gate is open)',
        DROP,
      ],
    },
  },
  {
    description:
      'an unknown fault in the drain that hit it names drop only; its text is already shown',
    given: { reason: 'upstream:fault', detail: 'gh: an odd reply' },
    expect: { output: [DROP] },
  },
  {
    description: 'a rate limit names naught; a wait is its fix',
    given: { reason: 'upstream:rate-limit' },
    expect: { output: [] },
  },
  {
    description: 'a gate names naught here; the lift is its fix',
    given: { reason: 'radio.uses:blocked — org' },
    expect: { output: [] },
  },
  {
    description: 'a record never tried names naught',
    given: { reason: null },
    expect: { output: [] },
  },
  {
    description:
      'a record already as-human names the gh login, never a second as-human amend',
    given: { reason: 'upstream:401', auth: 'as-human' },
    expect: {
      output: [
        'check the gh login on this host: gh auth status (else: gh auth login), then: rhx radio.task.queue drain',
        DROP,
      ],
    },
  },
  {
    description:
      'a record of its own default auth, just sent under drain --auth as-human, names the gh login, never an as-human amend',
    given: { reason: 'upstream:access', authOverride: 'as-human' },
    expect: {
      output: [
        'check the gh login on this host: gh auth status (else: gh auth login), then: rhx radio.task.queue drain',
        DROP,
      ],
    },
  },
  {
    description:
      'a record with no --auth (the default, which may have run as-human on this box) names the robot amend and the gh login check, never an as-human amend',
    given: { reason: 'upstream:401', auth: null },
    expect: { output: [...AMEND_DEFAULT, DROP] },
  },
  {
    description:
      'a record with no --auth whose default auth could not be derived names the same two moves',
    given: { reason: 'upstream:auth', auth: null },
    expect: { output: [...AMEND_DEFAULT, DROP] },
  },
  {
    description:
      'as-human refused by the test-env guard names the guard and a robot auth, never the gh login',
    given: {
      reason: 'upstream:auth',
      auth: 'as-human',
      detail:
        'ConstraintError: --auth as-human is forbidden in test environment. use --auth as-robot:env(TOKEN_VAR) or --auth as-robot:shx(command) instead.',
    },
    expect: {
      output: [
        "the test-env guard refuses as-human; amend it to a robot auth: rhx radio.task.queue set --uuid a1b2c3d4e5f60718 --auth 'as-robot:env(GH_TOKEN)'",
        DROP,
      ],
    },
  },
];

describe('asRadioQueueFixLines', () => {
  given('[case0] every reason a fix line can name', () => {
    when('[t0] the fix lines are derived for each', () => {
      then(
        'no line sends the whole queue under one auth (F3: the human picks each github write)',
        () => {
          const linesAll = FIX_CASES.flatMap((thisCase) =>
            asRadioQueueFixLines({
              record: genRecord({ reason: thisCase.given.reason }),
              authOverride: null,
              detail: null,
            }),
          );
          expect(linesAll.length).toBeGreaterThan(0);
          expect(linesAll.join('\n')).not.toMatch(/drain --auth/);
        },
      );
    });
  });

  given(
    '[caseGuard] the as-human test-env guard, as the derive throws it',
    () => {
      when('[t0] its real message is the detail of a held record', () => {
        then(
          'the fix lines name the guard, never the gh login: the two modules agree on the text',
          async () => {
            // the record persists the fault as text, so this pair is matched on text; this clamp
            // goes red if either side rewords it
            const error = await getError(
              getGithubTokenByAuthArg(
                { auth: 'as-human' },
                {
                  env: { JEST_WORKER_ID: '1' },
                  shx: async () => ({ stdout: '', stderr: '' }),
                },
              ),
            );
            const lines = asRadioQueueFixLines({
              record: new RadioTaskRecord({
                ...genRecord({ reason: 'upstream:auth' }),
                auth: 'as-human',
              }),
              authOverride: null,
              detail: error.message,
            });
            expect(lines[0]).toContain('the test-env guard refuses as-human');
          },
        );
      });
    },
  );

  FIX_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the fix lines are derived', () => {
        then('it yields the expected lines', () => {
          expect(
            asRadioQueueFixLines({
              record: new RadioTaskRecord({
                ...genRecord({ reason: thisCase.given.reason }),
                auth:
                  'auth' in thisCase.given
                    ? (thisCase.given.auth ?? null)
                    : AUTH_ROBOT,
              }),
              authOverride:
                'authOverride' in thisCase.given
                  ? (thisCase.given.authOverride ?? null)
                  : null,
              detail:
                'detail' in thisCase.given
                  ? (thisCase.given.detail ?? null)
                  : null,
            }),
          ).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});

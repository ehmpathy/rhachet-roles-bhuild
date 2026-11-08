import { given, then, when } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';
import { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';
import { RadioTaskRecordStatus } from '@src/domain.objects/RadioTaskRecordStatus';
import { RadioTaskRepo } from '@src/domain.objects/RadioTaskRepo';

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

const AMEND =
  'amend it: rhx radio.task.queue set --uuid a1b2c3d4e5f60718 --auth as-human (needs a gh login on this host)';
const FIX_DEFAULT = [
  'fix the ehmpath bot token: rhx keyrack unlock --owner ehmpath --env prep (if absent: rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep)',
  'or fix the ambient credential, the first one set of GH_TOKEN, GITHUB_TOKEN, the gh login: rotate or unset that env token, else gh auth login; then: rhx radio.task.queue drain',
  'or amend it: rhx radio.task.queue set --uuid a1b2c3d4e5f60718 --auth as-human (needs a gh login on this host)',
];
// an access refusal: the bot token is live but lacks the grant, so its fix is the grant
const FIX_DEFAULT_ACCESS = [
  'fix the ehmpath bot access: grant the ehmpath bot write on the target repo (else a token with that grant: rhx keyrack set --owner ehmpath --key EHMPATH_BEAVER_GITHUB_TOKEN --env prep)',
  ...FIX_DEFAULT.slice(1),
];
const DROP =
  'or drop it: rhx radio.task.queue del --uuid a1b2c3d4e5f60718 --why "<why>"';

const FIX_CASES = [
  {
    description:
      'a live push whose fault tree already names each credential fix names only the amend + drop, never each fix twice (#513)',
    given: { reason: 'upstream:401', isCredentialFixShown: true },
    expect: { output: [`or ${AMEND}`, DROP] },
  },
  {
    description:
      'an access fault under a stored auth names amend + drop (the #599 shape)',
    given: { reason: 'upstream:access', auth: 'as-robot:env(GH_TOKEN)' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description:
      'an access fault under the default auth names both credential fixes + drop, the bot fix as a grant since an unlock cannot cure a live token that lacks one (#513)',
    given: { reason: 'upstream:access' },
    expect: { output: [...FIX_DEFAULT_ACCESS, DROP] },
  },
  {
    description:
      'a repo the default auth cannot see names amend + drop; the default auth never falls back past a not-found',
    given: { reason: 'upstream:not-found' },
    expect: { output: [AMEND, DROP] },
  },
  {
    description:
      'a rejected token under the default auth names both credential fixes + drop (#513)',
    given: { reason: 'upstream:401' },
    expect: { output: [...FIX_DEFAULT, DROP] },
  },
  {
    description:
      'an auth not derivable under the default auth names both credential fixes + drop (#513)',
    given: { reason: 'upstream:auth' },
    expect: { output: [...FIX_DEFAULT, DROP] },
  },
  {
    description:
      'an auth not derivable under a stored robot auth names amend + drop',
    given: { reason: 'upstream:auth', auth: 'as-robot:env(GH_TOKEN)' },
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
              isCredentialFixShown: false,
            }),
          );
          expect(linesAll.length).toBeGreaterThan(0);
          expect(linesAll.join('\n')).not.toMatch(/drain --auth/);
        },
      );
      then(
        'an access fault never names a keyrack unlock: the bot token is live, it lacks the grant',
        () => {
          const linesAccess = asRadioQueueFixLines({
            record: genRecord({ reason: 'upstream:access' }),
            authOverride: null,
            detail: null,
            isCredentialFixShown: false,
          });
          expect(linesAccess.join('\n')).not.toContain('keyrack unlock');
          expect(linesAccess[0]).toContain('grant the ehmpath bot write');
        },
      );
    });
  });

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
                    : null,
              }),
              authOverride:
                'authOverride' in thisCase.given
                  ? (thisCase.given.authOverride ?? null)
                  : null,
              detail:
                'detail' in thisCase.given
                  ? (thisCase.given.detail ?? null)
                  : null,
              isCredentialFixShown:
                'isCredentialFixShown' in thisCase.given
                  ? (thisCase.given.isCredentialFixShown ?? false)
                  : false,
            }),
          ).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});

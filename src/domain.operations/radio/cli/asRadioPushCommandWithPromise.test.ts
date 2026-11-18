import { given, then, when } from 'test-fns';

import { asRadioPushCommandWithPromise } from './asRadioPushCommandWithPromise';
import type { RadioPushArgs } from './RadioPushArgs';

const LITERAL = 'task-to-public-repo-is-anonymized';

const argsBase: RadioPushArgs = {
  via: 'gh.issues',
  into: 'sandpine/svc-lessons',
  exid: null,
  status: null,
  title: null,
  description: null,
  idem: null,
  auth: null,
};

const TEST_CASES: {
  description: string;
  given: { args: Partial<RadioPushArgs>; promise: string | null };
  expect: string;
}[] = [
  {
    description: 'title and body: the push plus the promise',
    given: {
      args: { title: 'book a lesson', description: 'remind at 9am' },
      promise: LITERAL,
    },
    expect: `rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --title 'book a lesson' --description 'remind at 9am' --promise ${LITERAL}`,
  },
  {
    description: '--into @this is kept',
    given: {
      args: { into: '@this', title: 'x', description: 'y' },
      promise: LITERAL,
    },
    expect: `rhx radio.task.push --via gh.issues --into @this --title x --description y --promise ${LITERAL}`,
  },
  {
    description: '--description @stdin is kept as @stdin',
    given: { args: { title: 'x', description: '@stdin' }, promise: LITERAL },
    expect: `rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --title x --description @stdin --promise ${LITERAL}`,
  },
  {
    description: '--exid and --status ride first, after the target',
    given: {
      args: { exid: '5', status: 'CLAIMED', description: 'claimed' },
      promise: LITERAL,
    },
    expect: `rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --exid 5 --status CLAIMED --description claimed --promise ${LITERAL}`,
  },
  {
    description: '--idem and --auth are carried',
    given: {
      args: { title: 'x', description: 'y', idem: 'upsert', auth: 'as-human' },
      promise: LITERAL,
    },
    expect: `rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --title x --description y --idem upsert --auth as-human --promise ${LITERAL}`,
  },
  {
    description: 'an shx auth with parens and quotes is quoted whole',
    given: {
      args: { title: 'x', description: 'y', auth: `as-robot:shx(echo "t")` },
      promise: LITERAL,
    },
    expect: `rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --title x --description y --auth 'as-robot:shx(echo "t")' --promise ${LITERAL}`,
  },
  {
    description: 'an inner single quote closes, escapes, and reopens',
    given: { args: { title: `it's wet`, description: 'y' }, promise: LITERAL },
    expect: `rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --title 'it'\\''s wet' --description y --promise ${LITERAL}`,
  },
  {
    description: 'a null promise prints no --promise (the auth-cure re-run)',
    given: {
      args: { title: 'x', description: 'y', auth: 'as-human' },
      promise: null,
    },
    expect:
      'rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --title x --description y --auth as-human',
  },
];

describe('asRadioPushCommandWithPromise', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the command is composed', () => {
        then('it reprints every flag the push took', () => {
          expect(
            asRadioPushCommandWithPromise({
              args: { ...argsBase, ...thisCase.given.args },
              promise: thisCase.given.promise,
            }),
          ).toEqual(thisCase.expect);
        });
      });
    }),
  );

  given(
    '[case9] a body with a quote, a dollar, a backtick, and a newline',
    () => {
      when('[t0] the command is composed', () => {
        then('the body is one single-quoted word, every byte literal', () => {
          const body = "it's $HOME `uname`\nline two";
          const command = asRadioPushCommandWithPromise({
            args: { ...argsBase, title: 'x', description: body },
            promise: LITERAL,
          });
          expect(command).toContain(
            `--description 'it'\\''s $HOME \`uname\`\nline two'`,
          );
          expect(command.endsWith(`--promise ${LITERAL}`)).toBe(true);
        });
      });
    },
  );
});

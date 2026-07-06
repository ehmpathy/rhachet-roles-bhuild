import { asGithubAuthMode } from './asGithubAuthMode';

const TEST_CASES: {
  description: string;
  auth: string;
  expect: ReturnType<typeof asGithubAuthMode>;
}[] = [
  {
    description: 'parses as-robot:via-keyrack(owner)',
    auth: 'as-robot:via-keyrack(ehmpath)',
    expect: { kind: 'via-keyrack', owner: 'ehmpath' },
  },
  {
    description: 'parses as-robot:shx(command) with pipes intact',
    auth: 'as-robot:shx(op item get token | jq -r .value)',
    expect: { kind: 'shx', command: 'op item get token | jq -r .value' },
  },
  {
    description: 'parses as-robot:env(VAR)',
    auth: 'as-robot:env(MY_TOKEN)',
    expect: { kind: 'env', envVar: 'MY_TOKEN' },
  },
  {
    description: 'parses as-human',
    auth: 'as-human',
    expect: { kind: 'as-human' },
  },
  {
    description: 'falls back to unknown for an unrecognized mode',
    auth: 'bogus-mode',
    expect: { kind: 'unknown', raw: 'bogus-mode' },
  },
];

describe('asGithubAuthMode', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const mode = asGithubAuthMode({ auth: thisCase.auth });
      expect(mode).toEqual(thisCase.expect);
    }),
  );
});

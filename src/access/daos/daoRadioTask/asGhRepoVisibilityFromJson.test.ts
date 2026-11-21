import { given, then, when } from 'test-fns';

import { asGhRepoVisibilityFromJson } from './asGhRepoVisibilityFromJson';

const TEST_CASES = [
  {
    description: 'PUBLIC',
    stdout: '{"visibility":"PUBLIC"}',
    expect: { visibility: 'public' },
  },
  {
    description: 'PRIVATE',
    stdout: '{"visibility":"PRIVATE"}',
    expect: { visibility: 'private' },
  },
  {
    description: 'INTERNAL',
    stdout: '{"visibility":"INTERNAL"}',
    expect: { visibility: 'internal' },
  },
  {
    description: 'malformed json',
    stdout: 'not json',
    expect: { visibility: 'unreadable', cause: 'visibility json unparsable' },
  },
  {
    description: 'an absent field',
    stdout: '{}',
    expect: { visibility: 'unreadable', cause: 'visibility field absent' },
  },
  {
    description: 'an empty value',
    stdout: '{"visibility":""}',
    expect: { visibility: 'unreadable', cause: 'visibility field absent' },
  },
  {
    description: 'an unknown enum',
    stdout: '{"visibility":"SECRET"}',
    expect: {
      visibility: 'unreadable',
      cause: 'visibility value "SECRET" unknown',
    },
  },
  {
    description: 'a lowercase value, which fails closed',
    stdout: '{"visibility":"private"}',
    expect: {
      visibility: 'unreadable',
      cause: 'visibility value "private" unknown',
    },
  },
];

describe('asGhRepoVisibilityFromJson', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the stdout is read', () => {
        then('it returns the visibility, or unreadable with its cause', () => {
          expect(
            asGhRepoVisibilityFromJson({ stdout: thisCase.stdout }),
          ).toEqual(thisCase.expect);
        });
      });
    }),
  );
});

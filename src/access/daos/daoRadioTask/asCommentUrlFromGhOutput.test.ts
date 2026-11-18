import { given, then } from 'test-fns';

import { asCommentUrlFromGhOutput } from './asCommentUrlFromGhOutput';

const URL =
  'https://github.com/sandpine/svc-lessons/issues/489#issuecomment-1001';

const TEST_CASES = [
  {
    description: 'the url alone',
    given: { output: URL },
    expect: URL,
  },
  {
    description: 'the url with the trailed newline gh prints',
    given: { output: `${URL}\n` },
    expect: URL,
  },
  {
    description: 'the url after a notice line, then a blank line',
    given: { output: `- added a comment\n${URL}\n\n` },
    expect: URL,
  },
  {
    description: 'output with no comment url',
    given: { output: 'https://github.com/sandpine/svc-lessons/issues/489\n' },
    expect: null,
  },
  {
    description: 'empty output',
    given: { output: '' },
    expect: null,
  },
];

describe('asCommentUrlFromGhOutput', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it reads the comment url, or null', () => {
        expect(asCommentUrlFromGhOutput(thisCase.given)).toEqual(
          thisCase.expect,
        );
      });
    }),
  );
});

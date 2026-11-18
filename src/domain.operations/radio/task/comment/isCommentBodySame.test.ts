import { given, then } from 'test-fns';

import { isCommentBodySame } from './isCommentBodySame';

const TEST_CASES = [
  {
    description: 'the exact body matches',
    given: { a: 'board 7 needs a new fin', b: 'board 7 needs a new fin' },
    expect: true,
  },
  {
    description: 'a trailed newline, as @stdin pipes one, still matches',
    given: { a: 'board 7 needs a new fin\n', b: 'board 7 needs a new fin' },
    expect: true,
  },
  {
    description: 'crlf line ends match lf line ends',
    given: { a: 'line one\r\nline two', b: 'line one\nline two' },
    expect: true,
  },
  {
    description: 'a different body does not match',
    given: { a: 'board 7 needs a new fin', b: 'board 8 needs a new fin' },
    expect: false,
  },
  {
    description: 'inner whitespace is part of the body',
    given: { a: 'tide  table', b: 'tide table' },
    expect: false,
  },
];

describe('isCommentBodySame', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then(`returns ${thisCase.expect}`, () => {
        expect(isCommentBodySame(thisCase.given)).toEqual(thisCase.expect);
      });
    }),
  );
});

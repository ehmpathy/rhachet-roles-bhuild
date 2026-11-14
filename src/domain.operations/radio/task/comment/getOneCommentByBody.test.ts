import { given, then } from 'test-fns';

import { getOneCommentByBody } from './getOneCommentByBody';

const COMMENTS = [
  {
    body: 'lgtm once the tide table test passes',
    url: 'https://x/#issuecomment-1',
  },
  {
    body: 'the tide table test passes now\n',
    url: 'https://x/#issuecomment-2',
  },
  { body: 'the tide table test passes now', url: 'https://x/#issuecomment-3' },
];

const TEST_CASES: {
  description: string;
  given: { body: string };
  expect: string | null;
}[] = [
  {
    description: 'a body on the thread: its comment',
    given: { body: 'lgtm once the tide table test passes' },
    expect: 'https://x/#issuecomment-1',
  },
  {
    description: 'a body that matches two comments: the first one',
    given: { body: 'the tide table test passes now' },
    expect: 'https://x/#issuecomment-2',
  },
  {
    description: 'a body with \\r\\n line ends and edge space: still found',
    given: { body: '  lgtm once the tide table test passes\r\n' },
    expect: 'https://x/#issuecomment-1',
  },
  {
    description: 'a body not on the thread: null',
    given: { body: 'the tide table test passes now!' },
    expect: null,
  },
];

describe('getOneCommentByBody', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it finds the comment, or null', () => {
        const found = getOneCommentByBody({
          comments: COMMENTS,
          body: thisCase.given.body,
        });
        expect(found?.url ?? null).toEqual(thisCase.expect);
      });
    }),
  );
});

import { MalfunctionError } from 'helpful-errors';
import { getError, given, then } from 'test-fns';

import { asCommentsFromGhIssueJson } from './asCommentsFromGhIssueJson';

const READ_CASES = [
  {
    description: 'a thread with no comments',
    given: { json: JSON.stringify({ number: 489, comments: [] }) },
    expect: [],
  },
  {
    description: 'a thread with comments; only body and url are kept',
    given: {
      json: JSON.stringify({
        number: 652,
        comments: [
          {
            author: { login: 'bert' },
            body: 'lgtm once the tide table test passes',
            url: 'https://github.com/sandpine/svc-lessons/pull/652#issuecomment-1',
          },
        ],
      }),
    },
    expect: [
      {
        body: 'lgtm once the tide table test passes',
        url: 'https://github.com/sandpine/svc-lessons/pull/652#issuecomment-1',
      },
    ],
  },
];

const FAULT_CASES = [
  { description: 'output that is not json', given: { json: 'not json' } },
  {
    description: 'json with no comments list',
    given: { json: JSON.stringify({ number: 489 }) },
  },
  {
    description: 'a comment with no url',
    given: {
      json: JSON.stringify({ number: 489, comments: [{ body: 'hi' }] }),
    },
  },
];

describe('asCommentsFromGhIssueJson', () => {
  READ_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it reads each comment body and url', () => {
        expect(asCommentsFromGhIssueJson(thisCase.given)).toEqual(
          thisCase.expect,
        );
      });
    }),
  );

  FAULT_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then(
        'it fails loud as a malfunction, never as "no comments"',
        async () => {
          const error = await getError(() =>
            asCommentsFromGhIssueJson(thisCase.given),
          );
          expect(error).toBeInstanceOf(MalfunctionError);
          expect(error.message).toContain(
            'gh cli output shape may have changed',
          );
        },
      );
    }),
  );
});

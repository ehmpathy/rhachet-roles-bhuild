import { given, then } from 'test-fns';

import { asCommentPushFlagsRefusal } from './asCommentPushFlagsRefusal';

const TEST_CASES: {
  description: string;
  given: {
    title: string | undefined;
    description: string | undefined;
    status: string | undefined;
    via: string | undefined;
    into: string | undefined;
    exid: string | undefined;
  };
  expect: string | null;
}[] = [
  {
    description: 'no push flag: no refusal',
    given: {
      title: undefined,
      description: undefined,
      status: undefined,
      via: 'gh.issues',
      into: 'sandpine/svc-lessons',
      exid: '489',
    },
    expect: null,
  },
  {
    description:
      'one push flag: it and its push are named, with the target the caller passed',
    given: {
      title: undefined,
      description: undefined,
      status: 'CLAIMED',
      via: 'gh.issues',
      into: 'sandpine/svc-lessons',
      exid: '489',
    },
    expect:
      "--status is not read by radio.task.comment, which only adds a comment; to change a task's title, body, or status, use rhx radio.task.push --via gh.issues --into sandpine/svc-lessons --exid 489 --status <status>",
  },
  {
    description:
      'two push flags: both named, in a stable order, with a plural verb',
    given: {
      title: 'wax the boards',
      description: 'all twelve',
      status: undefined,
      via: 'os.fileops',
      into: '@this',
      exid: 'wax-the-rental-boards-1a2b',
    },
    expect:
      "--title, --description are not read by radio.task.comment, which only adds a comment; to change a task's title, body, or status, use rhx radio.task.push --via os.fileops --into @this --exid wax-the-rental-boards-1a2b --title <title> --description <description>",
  },
  {
    description: 'a push flag with no target passed: placeholders stand in',
    given: {
      title: 'wax the boards',
      description: undefined,
      status: undefined,
      via: undefined,
      into: undefined,
      exid: undefined,
    },
    expect:
      "--title is not read by radio.task.comment, which only adds a comment; to change a task's title, body, or status, use rhx radio.task.push --via <via> --into <into> --exid <n> --title <title>",
  },
];

describe('asCommentPushFlagsRefusal', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it names the refusal, or null', () => {
        expect(asCommentPushFlagsRefusal(thisCase.given)).toEqual(
          thisCase.expect,
        );
      });
    }),
  );
});

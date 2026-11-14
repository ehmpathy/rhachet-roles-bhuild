import { given, then } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';

import { asCommentKeptNote } from './asCommentKeptNote';

const TEST_CASES: {
  description: string;
  given: { via: string };
  expect: string;
}[] = [
  {
    description: 'a gh.issues comment kept: it names the thread and the post',
    given: { via: RadioChannel.GH_ISSUES },
    expect: 'already on the thread — naught posted',
  },
  {
    description: 'an os.fileops comment kept: it names the log, never a thread',
    given: { via: RadioChannel.OS_FILEOPS },
    expect: 'already in the comment log — naught posted',
  },
];

describe('asCommentKeptNote', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then(`it reads "${thisCase.expect}"`, () => {
        expect(asCommentKeptNote(thisCase.given)).toEqual(thisCase.expect);
      });
    }),
  );
});

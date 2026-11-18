import { given, then } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';

import { asCommentBodyLengthRefusal } from './asCommentBodyLengthRefusal';

const TEST_CASES: {
  description: string;
  given: { via: RadioChannel; body: string };
  expect: string | null;
}[] = [
  {
    description: 'a gh body at the cap is accepted',
    given: { via: RadioChannel.GH_ISSUES, body: 'a'.repeat(65536) },
    expect: null,
  },
  {
    description:
      'a gh body one past the cap is refused, with its length and the fix',
    given: { via: RadioChannel.GH_ISSUES, body: 'a'.repeat(65537) },
    expect:
      '--comment is 65537 characters; github caps a comment at 65536. trim the body, or split it across comments',
  },
  {
    description:
      'an os.fileops body past the gh cap is accepted (a local log has no cap)',
    given: { via: RadioChannel.OS_FILEOPS, body: 'a'.repeat(65537) },
    expect: null,
  },
];

describe('asCommentBodyLengthRefusal', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it names the refusal, or null', () => {
        expect(asCommentBodyLengthRefusal(thisCase.given)).toEqual(
          thisCase.expect,
        );
      });
    }),
  );
});

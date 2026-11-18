import { ConstraintError } from 'helpful-errors';
import { getError, given, then } from 'test-fns';

import { RadioChannel } from '@src/domain.objects/RadioChannel';

import { asRadioTaskExidForChannel } from './asRadioTaskExidForChannel';

const ACCEPT_CASES: {
  description: string;
  given: { via: RadioChannel; exid: string };
  expect: string;
}[] = [
  {
    description: 'a gh issue number',
    given: { via: RadioChannel.GH_ISSUES, exid: '489' },
    expect: '489',
  },
  {
    description: 'an os.fileops task id',
    given: { via: RadioChannel.OS_FILEOPS, exid: 'wax-the-rental-boards-1a2b' },
    expect: 'wax-the-rental-boards-1a2b',
  },
];

const REFUSE_CASES: {
  description: string;
  given: { via: RadioChannel; exid: string };
}[] = [
  {
    description: 'a gh exid that is not a number',
    given: { via: RadioChannel.GH_ISSUES, exid: 'wax-the-rental-boards' },
  },
  {
    description: 'an os.fileops exid that climbs out of its dir',
    given: { via: RadioChannel.OS_FILEOPS, exid: '../../etc' },
  },
];

describe('asRadioTaskExidForChannel', () => {
  ACCEPT_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it is accepted as is', () => {
        expect(asRadioTaskExidForChannel(thisCase.given)).toEqual(
          thisCase.expect,
        );
      });
    }),
  );

  REFUSE_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      then('it is refused by the grammar of its own channel', async () => {
        const error = await getError(() =>
          asRadioTaskExidForChannel(thisCase.given),
        );
        expect(error).toBeInstanceOf(ConstraintError);
      });
    }),
  );
});

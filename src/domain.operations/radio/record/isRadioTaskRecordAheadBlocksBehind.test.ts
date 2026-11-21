import { given, then, when } from 'test-fns';

import { RadioTaskStatus } from '@src/domain.objects/RadioTaskStatus';

import { isRadioTaskRecordAheadBlocksBehind } from './isRadioTaskRecordAheadBlocksBehind';

const textOnly = { status: null, title: null, description: 'b' };
const statusOnly = {
  status: RadioTaskStatus.CLAIMED,
  title: null,
  description: null,
};
const statusAndText = {
  status: RadioTaskStatus.CLAIMED,
  title: null,
  description: 'b',
};

const TEST_CASES = [
  {
    description: 'a status step ahead, a status-only behind',
    ahead: statusOnly,
    behind: { title: null, description: null },
    expect: true,
  },
  {
    description: 'a status + text step ahead, a text behind',
    ahead: statusAndText,
    behind: { title: null, description: 'c' },
    expect: true,
  },
  {
    description: 'text ahead, text behind (last write wins)',
    ahead: textOnly,
    behind: { title: 't', description: null },
    expect: true,
  },
  {
    description: 'text-only ahead, status-only behind',
    ahead: textOnly,
    behind: { title: null, description: null },
    expect: false,
  },
];

describe('isRadioTaskRecordAheadBlocksBehind', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the pair is checked', () => {
        then(`it reads ${thisCase.expect}`, () => {
          expect(
            isRadioTaskRecordAheadBlocksBehind({
              ahead: thisCase.ahead,
              behind: thisCase.behind,
            }),
          ).toEqual(thisCase.expect);
        });
      });
    }),
  );
});

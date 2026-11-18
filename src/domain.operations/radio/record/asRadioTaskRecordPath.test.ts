import { given, then, when } from 'test-fns';

import { asRadioTaskRecordPath } from './asRadioTaskRecordPath';

const TEST_CASES = [
  {
    description: 'an absolute record dir reads relative to the repo root',
    given: {
      dir: '/home/bert/sandpine/.behavior/.radio',
      cwd: '/home/bert/sandpine',
    },
    expect: { path: '.behavior/.radio/record.a1b2c3d4e5f60718.json' },
  },
  {
    description: 'a route record dir reads relative to the repo root',
    given: {
      dir: '/home/bert/sandpine/.behavior/v2026_11_16.book-a-lesson/.radio',
      cwd: '/home/bert/sandpine',
    },
    expect: {
      path: '.behavior/v2026_11_16.book-a-lesson/.radio/record.a1b2c3d4e5f60718.json',
    },
  },
];

describe('asRadioTaskRecordPath', () => {
  TEST_CASES.map((thisCase, index) =>
    given(`[case${index + 1}] a record dir at ${thisCase.given.dir}`, () => {
      when('[t0] the record path is rendered', () => {
        then(thisCase.description, () => {
          const path = asRadioTaskRecordPath(
            { dir: thisCase.given.dir, key: 'a1b2c3d4e5f60718' },
            { cwd: thisCase.given.cwd },
          );
          expect(path).toEqual(thisCase.expect.path);
        });
      });
    }),
  );
});

import { given, then, useThen, when } from 'test-fns';

import { asPathAbs } from './asPathAbs';

// posix paths by design: the lane runs only from bash skills, on a posix host
const CWD = '/home/bert/sandpine/svc-lessons';

const TEST_CASES: {
  description: string;
  given: { path: string };
  expect: { output: string };
}[] = [
  {
    description: 'a relative path lands under cwd',
    given: { path: '.behavior/v2026_11_08.x/1.vision.yield.md' },
    expect: { output: `${CWD}/.behavior/v2026_11_08.x/1.vision.yield.md` },
  },
  {
    description: 'an absolute path stays as is',
    given: { path: '/tmp/1.vision.yield.md' },
    expect: { output: '/tmp/1.vision.yield.md' },
  },
  {
    description: 'a relative climb is collapsed to where it truly lands',
    given: { path: 'a/../../outside.md' },
    expect: { output: '/home/bert/sandpine/outside.md' },
  },
  {
    description: 'an absolute path is normalized too',
    given: { path: '/tmp/a/../1.vision.yield.md' },
    expect: { output: '/tmp/1.vision.yield.md' },
  },
];

describe('asPathAbs', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the path is cast to absolute', () => {
        const result = useThen('it casts', async () => ({
          output: asPathAbs({ path: thisCase.given.path, cwd: CWD }),
        }));

        then('it lands where the path truly points', () => {
          expect(result.output).toEqual(thisCase.expect.output);
        });
      });
    }),
  );
});

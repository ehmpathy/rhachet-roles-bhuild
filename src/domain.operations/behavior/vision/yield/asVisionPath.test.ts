import { given, then, useThen, when } from 'test-fns';

import { asVisionPath } from './asVisionPath';

// posix paths by design: the lane runs only from bash skills, on a posix host
const CWD = '/home/bert/git/sandpine/svc-lessons';

const TEST_CASES: {
  description: string;
  given: { vision: string };
  expect: { pathAbs: string; pathRel: string; isInside: boolean };
}[] = [
  {
    description: 'a path from cwd stays inside',
    given: { vision: '.behavior/v1/1.vision.yield.md' },
    expect: {
      pathAbs: `${CWD}/.behavior/v1/1.vision.yield.md`,
      pathRel: '.behavior/v1/1.vision.yield.md',
      isInside: true,
    },
  },
  {
    description: 'an absolute path inside cwd is named from cwd',
    given: { vision: `${CWD}/.behavior/v1/1.vision.yield.md` },
    expect: {
      pathAbs: `${CWD}/.behavior/v1/1.vision.yield.md`,
      pathRel: '.behavior/v1/1.vision.yield.md',
      isInside: true,
    },
  },
  {
    description: 'a `..` that lands back inside cwd stays inside',
    given: { vision: '.behavior/v1/../v2/1.vision.yield.md' },
    expect: {
      pathAbs: `${CWD}/.behavior/v2/1.vision.yield.md`,
      pathRel: '.behavior/v2/1.vision.yield.md',
      isInside: true,
    },
  },
  {
    description: 'a path that climbs above cwd is outside',
    given: { vision: '../outside.md' },
    expect: {
      pathAbs: '/home/bert/git/sandpine/outside.md',
      pathRel: '../outside.md',
      isInside: false,
    },
  },
  {
    description: 'a dir whose name starts with `..` stays inside',
    given: { vision: '..notes/1.vision.yield.md' },
    expect: {
      pathAbs: `${CWD}/..notes/1.vision.yield.md`,
      pathRel: '..notes/1.vision.yield.md',
      isInside: true,
    },
  },
  {
    description: 'cwd parent itself is outside',
    given: { vision: '..' },
    expect: {
      pathAbs: '/home/bert/git/sandpine',
      pathRel: '..',
      isInside: false,
    },
  },
  {
    description: 'a peer dir whose name starts with cwd is outside',
    given: { vision: `${CWD}-other/1.vision.yield.md` },
    expect: {
      pathAbs: `${CWD}-other/1.vision.yield.md`,
      pathRel: '../svc-lessons-other/1.vision.yield.md',
      isInside: false,
    },
  },
];

describe('asVisionPath', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the vision path is placed against cwd', () => {
        const result = useThen('it places', async () => ({
          path: asVisionPath({ vision: thisCase.given.vision, cwd: CWD }),
        }));

        then('it is placed inside or outside, as it truly lands', () => {
          expect(result.path).toEqual(thisCase.expect);
        });
      });
    }),
  );
});

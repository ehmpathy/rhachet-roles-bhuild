import { given, then, useThen, when } from 'test-fns';

import { asRefusalOfReadCode } from './asRefusalOfReadCode';

const PATH_REL =
  '.behavior/v2026_11_08.sandpine-lesson-reminders/1.vision.yield.md';

const TEST_CASES: {
  description: string;
  given: { code: string | null };
  expect: { refusal: { message: string; hint: string } | null };
}[] = [
  {
    description: 'ENOENT: the yield is absent',
    given: { code: 'ENOENT' },
    expect: {
      refusal: {
        message: 'the vision yield is absent',
        hint: `write ${PATH_REL}, then re-arrive`,
      },
    },
  },
  {
    description: 'ENOTDIR: a path through a file, which no write could create',
    given: { code: 'ENOTDIR' },
    expect: {
      refusal: {
        message: 'the vision path runs through a file',
        // never "write <path>": a path through a file cannot be written
        hint: "a part of the path is a file, not a dir; name the yield itself: --vision '<route>/1.vision.yield.md'",
      },
    },
  },
  {
    description: 'EISDIR: the path is a directory',
    given: { code: 'EISDIR' },
    expect: {
      refusal: {
        message: 'the vision path is not a file',
        // the dir the caller named, with the yield name a paste would need
        hint: `name the yield itself: --vision '${PATH_REL}/1.vision.yield.md'`,
      },
    },
  },
  {
    description: 'EACCES: no read permission',
    given: { code: 'EACCES' },
    expect: {
      refusal: {
        message: 'the vision yield is unreadable',
        hint: `grant read access to ${PATH_REL}, then re-arrive`,
      },
    },
  },
  {
    description: 'EPERM: the os bars the read',
    given: { code: 'EPERM' },
    expect: {
      refusal: {
        message: 'the vision yield is unreadable',
        hint: `grant read access to ${PATH_REL}, then re-arrive`,
      },
    },
  },
  {
    description: 'ELOOP: a symlink loop',
    given: { code: 'ELOOP' },
    expect: {
      refusal: {
        message: 'the vision path is a symlink loop',
        hint: "point the symlink at the real yield, or name the yield itself: --vision '<route>/1.vision.yield.md'",
      },
    },
  },
  {
    description: 'ENAMETOOLONG: a path past the os limit',
    given: { code: 'ENAMETOOLONG' },
    expect: {
      refusal: {
        message: 'the vision path is too long for the os',
        hint: "name the yield itself: --vision '<route>/1.vision.yield.md'",
      },
    },
  },
  {
    description: 'EIO: a fault the caller cannot fix is no refusal',
    given: { code: 'EIO' },
    expect: { refusal: null },
  },
  {
    description: 'no code at all is no refusal',
    given: { code: null },
    expect: { refusal: null },
  },
];

describe('asRefusalOfReadCode', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the code is cast to a refusal', () => {
        const result = useThen('it casts', async () => ({
          refusal: asRefusalOfReadCode({
            code: thisCase.given.code,
            pathRel: PATH_REL,
          }),
        }));

        then('it returns the refusal the code owes', () => {
          expect(result.refusal).toEqual(thisCase.expect.refusal);
        });
      });
    }),
  );
});

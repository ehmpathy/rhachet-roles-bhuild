import { given, then, useThen, when } from 'test-fns';

import { getAllVisionRootPurposeNitpicks } from './getAllVisionRootPurposeNitpicks';
import type { getOneVisionRootPurpose } from './getOneVisionRootPurpose';

const TEST_CASES: {
  description: string;
  given: { purpose: ReturnType<typeof getOneVisionRootPurpose> };
  expect: { what: RegExp | null };
}[] = [
  {
    description: 'no malformed why: no nitpick',
    given: {
      purpose: {
        section: 'present',
        isFirst: true,
        headers: 1,
        depth: 3,
        layers: 3,
        placeholders: 0,
        malformed: 0,
      },
    },
    expect: { what: null },
  },
  {
    description:
      'malformed whys beside real layers: one nitpick that counts them',
    given: {
      purpose: {
        section: 'present',
        isFirst: true,
        headers: 1,
        depth: 3,
        layers: 3,
        placeholders: 0,
        malformed: 2,
      },
    },
    expect: { what: /2 whys in a form the lane does not read/ },
  },
  {
    description:
      'malformed whys with no real layer: one nitpick, the one place the form is named',
    given: {
      purpose: {
        section: 'present',
        isFirst: true,
        headers: 1,
        depth: 0,
        layers: 0,
        placeholders: 0,
        malformed: 3,
      },
    },
    expect: { what: /3 whys in a form the lane does not read/ },
  },
  {
    description:
      'malformed whys beside scaffold and no real layer: one nitpick',
    given: {
      purpose: {
        section: 'present',
        isFirst: true,
        headers: 1,
        depth: 0,
        layers: 0,
        placeholders: 2,
        malformed: 1,
      },
    },
    expect: { what: /1 why in a form the lane does not read/ },
  },
  {
    description: 'section absent: no nitpick',
    given: {
      purpose: {
        section: 'absent',
        isFirst: false,
        headers: 0,
        depth: 0,
        layers: 0,
        placeholders: 0,
        malformed: 0,
      },
    },
    expect: { what: null },
  },
];

describe('getAllVisionRootPurposeNitpicks', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the nitpicks are read', () => {
        const result = useThen('it reads', async () => ({
          nitpicks: getAllVisionRootPurposeNitpicks(thisCase.given),
        }));

        then('earns the expected nitpick, with the `- why:` fix', () => {
          if (thisCase.expect.what === null) {
            expect(result.nitpicks).toEqual([]);
            return;
          }
          expect(result.nitpicks).toHaveLength(1);
          expect(result.nitpicks[0]!.what).toMatch(thisCase.expect.what);
          expect(result.nitpicks[0]!.fix).toMatch(
            /rewrite each as a `- why:` bullet/,
          );
        });
      });
    }),
  );

  given('a section present below another `##` section', () => {
    when('[t0] the nitpicks are read', () => {
      const result = useThen('it reads', async () => ({
        nitpicks: getAllVisionRootPurposeNitpicks({
          purpose: {
            section: 'present',
            isFirst: false,
            headers: 1,
            depth: 3,
            layers: 3,
            placeholders: 0,
            malformed: 0,
          },
        }),
      }));

      then('earns one nitpick that says to move it first', () => {
        expect(result.nitpicks).toHaveLength(1);
        expect(result.nitpicks[0]!.what).toMatch(/not the first `##` section/);
        expect(result.nitpicks[0]!.fix).toMatch(
          /move `## \.the root purpose` above/,
        );
      });
    });
  });

  given('a vision with two root purpose headers', () => {
    when('[t0] the nitpicks are read', () => {
      const result = useThen('it reads', async () => ({
        nitpicks: getAllVisionRootPurposeNitpicks({
          purpose: {
            section: 'present',
            isFirst: true,
            headers: 2,
            depth: 3,
            layers: 3,
            placeholders: 0,
            malformed: 0,
          },
        }),
      }));

      then('earns one nitpick that names the unread second header', () => {
        expect(result.nitpicks).toHaveLength(1);
        expect(result.nitpicks[0]!.what).toMatch(
          /2 `## \.the root purpose` headers; the lane reads only the first/,
        );
        expect(result.nitpicks[0]!.fix).toMatch(
          /keep one `## \.the root purpose`/,
        );
      });
    });
  });

  given('a section below another, with a why in a foreign form', () => {
    when('[t0] the nitpicks are read', () => {
      const result = useThen('it reads', async () => ({
        nitpicks: getAllVisionRootPurposeNitpicks({
          purpose: {
            section: 'present',
            isFirst: false,
            headers: 1,
            depth: 3,
            layers: 3,
            placeholders: 0,
            malformed: 1,
          },
        }),
      }));

      then('earns both nitpicks, form first', () => {
        expect(result.nitpicks).toHaveLength(2);
        expect(result.nitpicks[0]!.what).toMatch(
          /1 why in a form the lane does not read/,
        );
        expect(result.nitpicks[1]!.what).toMatch(/not the first `##` section/);
      });
    });
  });
});

import { given, then, useThen, when } from 'test-fns';

import { getAllVisionRootPurposeBlockers } from './getAllVisionRootPurposeBlockers';
import type { getOneVisionRootPurpose } from './getOneVisionRootPurpose';

/**
 * .what = a present root purpose read, with the given counts
 * .why  = the decider is fed hand-built reads, so its grain fails apart from the parser
 */
const asPurpose = (input: {
  depth: number;
  layers: number;
  placeholders: number;
  malformed: number;
}): ReturnType<typeof getOneVisionRootPurpose> => ({
  section: 'present',
  isFirst: true,
  headers: 1,
  ...input,
});

const TEST_CASES: {
  description: string;
  given: { purpose: ReturnType<typeof getOneVisionRootPurpose> };
  expect: { whats: RegExp[]; fixes: RegExp[] };
}[] = [
  {
    description: 'section absent: one blocker that names the exact header',
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
    expect: {
      whats: [/no `## \.the root purpose` section/],
      fixes: [
        /exactly so \(no text after it\).*a header inside a code fence or an html comment does not count/,
      ],
    },
  },
  {
    description: '3 layers deep: no blocker',
    given: {
      purpose: asPurpose({
        depth: 3,
        layers: 3,
        placeholders: 0,
        malformed: 0,
      }),
    },
    expect: { whats: [], fixes: [] },
  },
  {
    description: 'scaffold alone: one blocker, the depth blocker skipped',
    given: {
      purpose: asPurpose({
        depth: 0,
        layers: 0,
        placeholders: 3,
        malformed: 0,
      }),
    },
    expect: {
      whats: [/no motive in 3 layers/],
      fixes: [/drop the angle brackets/],
    },
  },
  {
    description: 'a scaffold layer beside 2 real: both blockers',
    given: {
      purpose: asPurpose({
        depth: 2,
        layers: 2,
        placeholders: 1,
        malformed: 0,
      }),
    },
    expect: {
      whats: [/no motive in 1 layer/, /2 layers deep; it owes at least 3/],
      fixes: [/drop the angle brackets/, /fill the scaffold layers first/],
    },
  },
  {
    description: '2 real layers, no scaffold: the depth fix says to dig deeper',
    given: {
      purpose: asPurpose({
        depth: 2,
        layers: 2,
        placeholders: 0,
        malformed: 0,
      }),
    },
    expect: {
      whats: [/2 layers deep; it owes at least 3/],
      fixes: [/ask why of the deepest layer/],
    },
  },
  {
    description:
      'malformed only: the depth fix says to write the first why; the form is the nitpick',
    given: {
      purpose: asPurpose({
        depth: 0,
        layers: 0,
        placeholders: 0,
        malformed: 3,
      }),
    },
    expect: {
      whats: [/0 layers deep/],
      fixes: [/write the first `- why:` bullet under the header/],
    },
  },
  {
    description: 'prose only: the depth fix says to write the first why',
    given: {
      purpose: asPurpose({
        depth: 0,
        layers: 0,
        placeholders: 0,
        malformed: 0,
      }),
    },
    expect: {
      whats: [/0 layers deep/],
      fixes: [/write the first `- why:` bullet/],
    },
  },
  {
    description: 'flat bullets: the depth fix says to nest them',
    given: {
      purpose: asPurpose({
        depth: 1,
        layers: 3,
        placeholders: 0,
        malformed: 0,
      }),
    },
    expect: {
      whats: [/1 layer deep/],
      fixes: [/nest each `- why:` at least 2 columns under the last/],
    },
  },
];

describe('getAllVisionRootPurposeBlockers', () => {
  TEST_CASES.map((thisCase) =>
    given(thisCase.description, () => {
      when('[t0] the blockers are read', () => {
        const result = useThen('it reads', async () => ({
          blockers: getAllVisionRootPurposeBlockers(thisCase.given),
        }));

        then('earns the expected count of blockers', () => {
          expect(result.blockers).toHaveLength(thisCase.expect.whats.length);
        });

        then('each blocker names its concern and its fix', () => {
          thisCase.expect.whats.forEach((what, index) =>
            expect(result.blockers[index]!.what).toMatch(what),
          );
          thisCase.expect.fixes.forEach((fix, index) =>
            expect(result.blockers[index]!.fix).toMatch(fix),
          );
        });
      });
    }),
  );
});

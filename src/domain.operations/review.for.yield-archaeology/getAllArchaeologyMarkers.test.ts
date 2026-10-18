import { given, then, when } from 'test-fns';

import { getAllArchaeologyMarkers } from './getAllArchaeologyMarkers';

const asSlugs = (input: { lines: string[] }): string[] =>
  getAllArchaeologyMarkers({ path: 'x.yield.md', lines: input.lines }).map(
    (point) => point.slug,
  );

describe('getAllArchaeologyMarkers', () => {
  given('[case1] a yield that states only what holds', () => {
    when('[t0] scanned', () => {
      then('no point is raised', () => {
        expect(
          asSlugs({
            lines: [
              '# 1.vision.yield — the decision',
              'the guard binds `--paths-wout`, so the test files stay out of scope.',
              'the scope is `$route/*.yield.md` and never `*.yield*`.',
            ],
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case2] a yield that states its own road', () => {
    when('[t0] a retraction is present', () => {
      then('it is a blocker', () => {
        expect(
          asSlugs({ lines: ['i had written that the flag removes 200k.'] }),
        ).toEqual(['retraction']);
      });
    });

    when('[t1] an attempt trail is present', () => {
      then('it is a blocker', () => {
        expect(
          asSlugs({
            lines: ['we first tried a dir, then we landed on an infix.'],
          }),
        ).toEqual(['attempt-trail']);
      });
    });

    when('[t2] a confidence moved', () => {
      then('the PAIR is a blocker and a lone state is not', () => {
        expect(
          asSlugs({ lines: ['priced at 79% → **87%** on a read.'] }),
        ).toEqual(['confidence-trajectory']);
        expect(asSlugs({ lines: ['the residue only, at 87%.'] })).toEqual([]);
      });
    });

    when('[t3] a review round is referenced', () => {
      then('it is a blocker', () => {
        expect(
          asSlugs({ lines: ['on the third round the lane overflowed.'] }),
        ).toEqual(['iteration-ref']);
      });
    });

    when('[t4] a deliberation is narrated', () => {
      then('it is a blocker', () => {
        expect(
          asSlugs({ lines: ['we deliberately chose the infix over the dir.'] }),
        ).toEqual(['decision-process']);
      });
    });

    when('[t5] a word whose referent is a moment', () => {
      then('it is a nitpick', () => {
        expect(
          asSlugs({ lines: ['as we saw above, the lane is unbound.'] }),
        ).toEqual(['temporal-deixis']);
      });
    });

    when('[t6] a calendar date is present', () => {
      then('it is a nitpick — dates are accretion tells', () => {
        expect(
          asSlugs({ lines: ['measured 2026-09-07 against disk.'] }),
        ).toEqual(['calendar-date']);
      });
    });

    // 🔴 the generalization clamp. the markers catch paraphrase, not only the
    //    canonical form — a widened alternation with no new false positive.
    when('[t7] a retraction stated as hindsight', () => {
      then('it is a blocker', () => {
        expect(
          asSlugs({ lines: ['in hindsight the dir was the wrong shape.'] }),
        ).toEqual(['retraction']);
      });
    });

    when('[t8] an attempt trail stated as abandonment', () => {
      then('it is a blocker', () => {
        expect(
          asSlugs({ lines: ['we abandoned the dir for an infix.'] }),
        ).toEqual(['attempt-trail']);
      });
    });

    when('[t9] a confidence moved in words', () => {
      then('it is a blocker', () => {
        expect(
          asSlugs({ lines: ['my confidence grew once the read landed.'] }),
        ).toEqual(['confidence-trajectory']);
      });
    });

    when('[t10] a round referenced without a number', () => {
      then('it is a blocker', () => {
        expect(
          asSlugs({ lines: ['this round the lane overflowed again.'] }),
        ).toEqual(['iteration-ref']);
      });
    });

    // 🔴 the precision clamp. a GENERIC quantifier over rounds — a claim about how rounds
    //    work, not a narration of THIS doc's own — is not archaeology. it must not fire, or
    //    the lint fines a design table for a claim about the mechanism it improves.
    when('[t11] a generic quantifier over rounds', () => {
      then('no point is raised', () => {
        expect(
          asSlugs({ lines: ['each round can only lengthen the artifact.'] }),
        ).toEqual([]);
      });
    });
  });

  given('[case3] a passage that may never be tidied', () => {
    // 🔴 the clamp. a verbatim quote carries the wisher's own words, and
    //    `rule.require.timeless-lessons` exempts `.said` outright. a fenced block is
    //    not prose at all. without these two exemptions the lint fires on the seed
    //    archive it exists to point at.
    when('[t0] the tell sits in a blockquote', () => {
      then('no point is raised', () => {
        expect(
          asSlugs({ lines: ['> i had written that it was fine.'] }),
        ).toEqual([]);
      });
    });

    when('[t1] the tell sits in a fenced block', () => {
      then('no point is raised', () => {
        expect(
          asSlugs({
            lines: ['```md', 'we first tried a dir.', '```'],
          }),
        ).toEqual([]);
      });
    });

    when('[t2] a fence closes', () => {
      then('the lint resumes after it', () => {
        expect(
          asSlugs({
            lines: [
              '```',
              'we first tried a dir.',
              '```',
              'i had written otherwise.',
            ],
          }),
        ).toEqual(['retraction']);
      });
    });
  });

  given('[case4] one line that carries two tells', () => {
    when('[t0] scanned', () => {
      then('both are raised, so neither hides behind the other', () => {
        expect(
          asSlugs({
            lines: ['i had written it at 62% → **91%** before the read.'],
          }),
        ).toEqual(['retraction', 'confidence-trajectory']);
      });
    });
  });
});

import { given, then, when } from 'test-fns';

import { computeFeedbackOutput } from './computeFeedbackOutput';

/**
 * .what = the two bytes that open EVERY ansi escape — `ESC` then `[`
 *
 * .why  = one probe catches the whole family (`[2m`, `[0m`, `[31m`, …), so a
 *         clamp against it cannot be dodged by a color nobody listed.
 *
 * .note = a plain string, deliberately, never a regex. biome's
 *         `lint/suspicious/noControlCharactersInRegex` forbids a control char
 *         inside a regex literal, and the suppression for it would be a
 *         comment that reads as a guardrail and holds naught. `toContain` is
 *         exactly as strong here and needs no suppression at all.
 */
const ANSI_CSI = '\x1b[';

describe('computeFeedbackOutput', () => {
  given('[case1] feedback filename without opener', () => {
    when('[t0] computeFeedbackOutput is called', () => {
      const result = computeFeedbackOutput({
        feedbackFilename:
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        artifact: 'execution',
      });

      // output format:
      // line 0: "🦫 wassup?"
      // line 1: "" (blank line between mascot and artifact)
      // line 2: "🌲 feedback.give --against execution"
      // line 3: "   ├─ ✓ filename"
      // line 4: "   ├─ tip: use --version ++"
      // line 5: "   └─ tip: use --open nvim"

      then('line 0 is mascot header "🦫 wassup?"', () => {
        const lines = result.split('\n');
        expect(lines[0]).toEqual('🦫 wassup?');
      });

      then('line 1 is blank (between mascot and artifact)', () => {
        const lines = result.split('\n');
        expect(lines[1]).toEqual('');
      });

      then('line 2 is artifact header with --against', () => {
        const lines = result.split('\n');
        expect(lines[2]).toContain('🌲 feedback.give --against execution');
      });

      then('line 3 contains ✓ and filename', () => {
        const lines = result.split('\n');
        expect(lines[3]).toContain('✓');
        expect(lines[3]).toContain(
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
      });

      then('line 3 uses ├─ connector', () => {
        const lines = result.split('\n');
        expect(lines[3]).toContain('├─');
      });

      then('line 4 contains --version ++ tip', () => {
        const lines = result.split('\n');
        expect(lines[4]).toContain('--version ++');
      });

      then('line 4 uses ├─ connector', () => {
        const lines = result.split('\n');
        expect(lines[4]).toContain('├─');
      });

      then('line 5 shows --open tip', () => {
        const lines = result.split('\n');
        expect(lines[5]).toContain('--open nvim');
      });

      then('line 5 uses └─ connector (last line)', () => {
        const lines = result.split('\n');
        expect(lines[5]).toContain('└─');
      });
    });
  });

  given('[case2] feedback filename with opener', () => {
    when('[t0] computeFeedbackOutput is called with opener', () => {
      const result = computeFeedbackOutput({
        feedbackFilename: '0.wish.md.[feedback].v2.[given].by_human.md',
        artifact: 'wish',
        opener: 'codium',
      });

      then('line 0 is mascot header "🦫 wassup?"', () => {
        const lines = result.split('\n');
        expect(lines[0]).toEqual('🦫 wassup?');
      });

      then('line 5 shows "opened in codium"', () => {
        const lines = result.split('\n');
        expect(lines[5]).toContain('opened in codium');
      });

      then('does not show --open tip', () => {
        expect(result).not.toContain('--open nvim');
      });

      then('line 5 uses └─ connector (last line)', () => {
        const lines = result.split('\n');
        expect(lines[5]).toContain('└─');
      });

      then('opener line is NOT dimmed (full color)', () => {
        const lines = result.split('\n');
        const dim = '\x1b[2m';
        expect(lines[5]).not.toContain(dim);
      });
    });
  });

  given('[case3] dim style applied only to tips', () => {
    when('[t0] computeFeedbackOutput is called without opener', () => {
      const result = computeFeedbackOutput({
        feedbackFilename: '0.wish.md.[feedback].v1.[given].by_human.md',
        artifact: 'wish',
      });

      const dim = '\x1b[2m';
      const lines = result.split('\n');

      then('version tip line is dimmed', () => {
        expect(lines[4]).toContain(dim);
      });

      then('open tip line is dimmed', () => {
        expect(lines[5]).toContain(dim);
      });
    });
  });

  // 🔴 the clamp for the blemish a peer reviewer caught at 5.3.verification:
  //   the dim escapes are readable on a terminal and become literal `[2m` /
  //   `[0m` noise in a captured stream — a pipe, a ci log, a jest snapshot.
  //   a snapshot exists so a human can vibecheck a render, so a control code
  //   baked into one is exactly what rule.forbid.snapshot-visual-blemishes
  //   forbids. the cli passes `process.stdout.isTTY`, so the captured render
  //   is clean and the human render keeps its dim.
  given('[case4] a captured stream — color is off', () => {
    when('[t0] computeFeedbackOutput is called with color false', () => {
      const result = computeFeedbackOutput(
        {
          feedbackFilename: '0.wish.md.[feedback].v1.[given].by_human.md',
          artifact: 'wish',
        },
        { color: false },
      );

      then('🔴 it carries NO ansi escape of any kind', () => {
        expect(result).not.toContain(ANSI_CSI);
      });

      then('the version tip still renders, undimmed', () => {
        const lines = result.split('\n');
        expect(lines[4]).toEqual(
          '   ├─ tip: use --version ++ to create a new version',
        );
      });

      then('the open tip still renders, undimmed', () => {
        const lines = result.split('\n');
        expect(lines[5]).toEqual(
          '   └─ tip: use --open nvim to open automatically',
        );
      });
    });

    when('[t1] an opener is supplied with color false', () => {
      const result = computeFeedbackOutput(
        {
          feedbackFilename: '0.wish.md.[feedback].v2.[given].by_human.md',
          artifact: 'wish',
          opener: 'codium',
        },
        { color: false },
      );

      then('the opener line renders clean', () => {
        const lines = result.split('\n');
        expect(lines[5]).toEqual('   └─ opened in codium');
      });
    });
  });
});

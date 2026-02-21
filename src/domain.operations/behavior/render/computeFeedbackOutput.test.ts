import { given, then, when } from 'test-fns';

import { computeFeedbackOutput } from './computeFeedbackOutput';

describe('computeFeedbackOutput', () => {
  given('[case1] feedback filename without opener', () => {
    when('[t0] computeFeedbackOutput is called', () => {
      const result = computeFeedbackOutput({
        feedbackFilename:
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
      });

      then('line 1 is empty (blank line before header)', () => {
        const lines = result.split('\n');
        expect(lines[0]).toEqual('');
      });

      then('line 2 is "🦫 wassup?"', () => {
        const lines = result.split('\n');
        expect(lines[1]).toEqual('🦫 wassup?');
      });

      then('line 3 contains ✓ and filename', () => {
        const lines = result.split('\n');
        expect(lines[2]).toContain('✓');
        expect(lines[2]).toContain(
          '5.1.execution.v1.i1.md.[feedback].v1.[given].by_human.md',
        );
      });

      then('line 3 uses ├─ connector', () => {
        const lines = result.split('\n');
        expect(lines[2]).toContain('├─');
      });

      then('line 4 contains --version ++ tip', () => {
        const lines = result.split('\n');
        expect(lines[3]).toContain('--version ++');
      });

      then('line 4 uses ├─ connector', () => {
        const lines = result.split('\n');
        expect(lines[3]).toContain('├─');
      });

      then('line 5 shows --open tip', () => {
        const lines = result.split('\n');
        expect(lines[4]).toContain('--open nvim');
      });

      then('line 5 uses └─ connector (last line)', () => {
        const lines = result.split('\n');
        expect(lines[4]).toContain('└─');
      });
    });
  });

  given('[case2] feedback filename with opener', () => {
    when('[t0] computeFeedbackOutput is called with opener', () => {
      const result = computeFeedbackOutput({
        feedbackFilename: '0.wish.md.[feedback].v2.[given].by_human.md',
        opener: 'codium',
      });

      then('line 2 is "🦫 wassup?"', () => {
        const lines = result.split('\n');
        expect(lines[1]).toEqual('🦫 wassup?');
      });

      then('line 5 shows "opened in codium"', () => {
        const lines = result.split('\n');
        expect(lines[4]).toContain('opened in codium');
      });

      then('does not show --open tip', () => {
        expect(result).not.toContain('--open nvim');
      });

      then('line 5 uses └─ connector (last line)', () => {
        const lines = result.split('\n');
        expect(lines[4]).toContain('└─');
      });

      then('opener line is NOT dimmed (full color)', () => {
        const lines = result.split('\n');
        const dim = '\x1b[2m';
        expect(lines[4]).not.toContain(dim);
      });
    });
  });

  given('[case3] dim style applied only to tips', () => {
    when('[t0] computeFeedbackOutput is called without opener', () => {
      const result = computeFeedbackOutput({
        feedbackFilename: '0.wish.md.[feedback].v1.[given].by_human.md',
      });

      const dim = '\x1b[2m';
      const lines = result.split('\n');

      then('version tip line is dimmed', () => {
        expect(lines[3]).toContain(dim);
      });

      then('open tip line is dimmed', () => {
        expect(lines[4]).toContain(dim);
      });
    });
  });
});

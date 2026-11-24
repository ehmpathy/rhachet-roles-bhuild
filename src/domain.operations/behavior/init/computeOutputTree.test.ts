import { given, then, when } from 'test-fns';

import { computeOutputTree } from './computeOutputTree';

describe('computeOutputTree', () => {
  given('all files are created', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: ['0.wish.md', '1.vision.md'],
        kept: [],
        updated: [],
        drifted: [],
      });

      then('header is "🦫 oh, behave!"', () => {
        expect(result).toContain('🦫 oh, behave!');
      });

      then('all lines show "+" prefix', () => {
        expect(result).toContain('+ 0.wish.md');
        expect(result).toContain('+ 1.vision.md');
      });
    });
  });

  given('all files are kept', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: [],
        kept: ['0.wish.md', '1.vision.md'],
        updated: [],
        drifted: [],
      });

      then('all lines show "✓" prefix', () => {
        expect(result).toContain('✓ 0.wish.md');
        expect(result).toContain('✓ 1.vision.md');
      });
    });
  });

  given('all files are updated', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: [],
        kept: [],
        updated: ['0.wish.md', '1.vision.md'],
        drifted: [],
      });

      then('all lines show "↻" prefix', () => {
        expect(result).toContain('↻ 0.wish.md');
        expect(result).toContain('↻ 1.vision.md');
      });
    });
  });

  given('mixed created and kept files', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: ['1.vision.md'],
        kept: ['0.wish.md'],
        updated: [],
        drifted: [],
      });

      then('correct symbol per file', () => {
        expect(result).toContain('✓ 0.wish.md');
        expect(result).toContain('+ 1.vision.md');
      });

      then('files sorted alphabetically', () => {
        const lines = result.split('\n');
        const wishIndex = lines.findIndex((l) => l.includes('0.wish.md'));
        const visionIndex = lines.findIndex((l) => l.includes('1.vision.md'));
        expect(wishIndex).toBeLessThan(visionIndex);
      });
    });
  });

  given('a kept file drifted from its template', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: [],
        kept: ['0.wish.md', '1.vision.guard'],
        updated: [],
        drifted: ['1.vision.guard'],
      });

      then('the drifted row carries the mark after its name', () => {
        expect(result).toContain(
          '└─ ✓ 1.vision.guard  ← drifted from its template, see below',
        );
      });

      then('a current kept row carries no mark', () => {
        expect(result).toContain('├─ ✓ 0.wish.md\n');
      });
    });
  });

  given('multiple files', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: ['a.md', 'b.md', 'c.md'],
        kept: [],
        updated: [],
        drifted: [],
      });

      then('uses ├─ for non-last items', () => {
        expect(result).toContain('├─ + a.md');
        expect(result).toContain('├─ + b.md');
      });

      then('uses └─ for last item', () => {
        expect(result).toContain('└─ + c.md');
      });
    });
  });

  given('empty input', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: [],
        kept: [],
        updated: [],
        drifted: [],
      });

      then('returns header only', () => {
        expect(result).toEqual('🦫 oh, behave!');
      });
    });
  });

  given('single file', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: ['0.wish.md'],
        kept: [],
        updated: [],
        drifted: [],
      });

      then('uses └─ for the only item', () => {
        expect(result).toContain('└─ + 0.wish.md');
      });
    });
  });
});

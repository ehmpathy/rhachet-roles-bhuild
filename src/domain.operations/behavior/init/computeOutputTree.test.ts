import { given, then, when } from 'test-fns';

import { computeOutputTree } from './computeOutputTree';

describe('computeOutputTree', () => {
  given('all files are created', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: ['0.wish.md', '1.vision.md'],
        kept: [],
        updated: [],
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

  given('multiple files', () => {
    when('computeOutputTree is called', () => {
      const result = computeOutputTree({
        created: ['a.md', 'b.md', 'c.md'],
        kept: [],
        updated: [],
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
      });

      then('uses └─ for the only item', () => {
        expect(result).toContain('└─ + 0.wish.md');
      });
    });
  });
});

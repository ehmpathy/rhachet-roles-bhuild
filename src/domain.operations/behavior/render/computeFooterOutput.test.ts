import { given, then, when } from 'test-fns';

import { computeFooterOutput } from './computeFooterOutput';

describe('computeFooterOutput', () => {
  given('a wishPathRel', () => {
    when('computeFooterOutput is called', () => {
      const result = computeFooterOutput({
        wishPathRel: '.behavior/v2026_01_08.test/0.wish.md',
      });

      then('output line 1 is "🌲 go on then,"', () => {
        const lines = result.split('\n');
        expect(lines[0]).toEqual('🌲 go on then,');
      });

      then('output line 2 contains the path with tree prefix', () => {
        const lines = result.split('\n');
        expect(lines[1]).toEqual('   ├─ .behavior/v2026_01_08.test/0.wish.md');
      });

      then('output line 3 shows tip about --open', () => {
        const lines = result.split('\n');
        expect(lines[2]).toContain('tip: use --open');
      });
    });
  });

  given('path with special characters', () => {
    when('computeFooterOutput is called', () => {
      const result = computeFooterOutput({
        wishPathRel: '.behavior/v2026_01_08.my-feature_v2/0.wish.md',
      });

      then('path is preserved exactly', () => {
        expect(result).toContain(
          '.behavior/v2026_01_08.my-feature_v2/0.wish.md',
        );
      });
    });
  });

  given('simple path', () => {
    when('computeFooterOutput is called', () => {
      const result = computeFooterOutput({
        wishPathRel: '0.wish.md',
      });

      then('returns formatted footer with tip', () => {
        expect(result).toContain('🌲 go on then,');
        expect(result).toContain('├─ 0.wish.md');
        expect(result).toContain('tip: use --open');
      });
    });
  });

  given('path with opener', () => {
    when('computeFooterOutput is called with opener', () => {
      const result = computeFooterOutput({
        wishPathRel: '.behavior/v2026_01_08.test/0.wish.md',
        opener: 'vim',
      });

      then('wish path uses ├─ branch', () => {
        const lines = result.split('\n');
        expect(lines[1]).toContain('├─');
      });

      then('third line shows "opened in" with opener name', () => {
        const lines = result.split('\n');
        expect(lines[2]).toContain('opened in vim');
      });

      then('third line uses └─ branch', () => {
        const lines = result.split('\n');
        expect(lines[2]).toContain('└─');
      });

      then('does not show --open tip', () => {
        expect(result).not.toContain('tip: use --open');
      });
    });
  });
});

import { given, then, when } from 'test-fns';

import { getWishContent } from './getWishContent';

describe('getWishContent', () => {
  given('[case1] inline content', () => {
    when('wish is not @stdin', () => {
      const result = getWishContent({ wish: 'my inline wish' });

      then('returns wish as-is', () => {
        expect(result).toEqual('my inline wish');
      });
    });
  });

  given('[case1] inline content with outer whitespace', () => {
    when('wish has spaces at start and end', () => {
      const result = getWishContent({ wish: '  padded wish  ' });

      then('returns wish as-is (no trim)', () => {
        expect(result).toEqual('  padded wish  ');
      });
    });
  });

  // note: [case2] @stdin reads from fd 0 — covered via acceptance tests
  // unit test would require mock of readFileSync(0) which couples to implementation
});

import { readFileSync } from 'fs';

/**
 * .what = extracts wish content from @stdin or returns inline value
 * .why = handles @stdin pattern for piped input
 */
export const getWishContent = (input: { wish: string }): string => {
  if (input.wish === '@stdin') {
    return readFileSync(0, 'utf-8').trim();
  }
  return input.wish;
};

import { HelpfulError } from 'helpful-errors';

/**
 * .what = the hint a helpful error carries in its metadata, or null
 * .why = a fault that names its fix only in metadata must still show that fix to the
 *        human who reads the held push
 */
export const asRadioErrorHint = (input: { error: Error }): string | null => {
  if (!(input.error instanceof HelpfulError)) return null;
  const hint: unknown = input.error.metadata?.hint;
  return typeof hint === 'string' ? hint : null;
};

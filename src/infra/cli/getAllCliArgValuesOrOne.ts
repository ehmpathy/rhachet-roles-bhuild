import { getAllCliArgValues } from './getAllCliArgValues';

/**
 * .what = every value a repeatable flag was passed with, or the one value the parser kept
 * .why = a repeated flag (`--to a --to b`) is read off argv whole; the schema parser keeps only
 *        one, so the argv read wins, and the parsed value backs it when argv holds none
 */
export const getAllCliArgValuesOrOne = (input: {
  key: string;
  argv: string[];
  parsed: string | undefined;
}): string[] => {
  const values = getAllCliArgValues({ key: input.key, argv: input.argv });
  if (values.length) return values;
  return input.parsed === undefined ? [] : [input.parsed];
};

import { getOneStdinText } from './getOneStdinText';

/**
 * .what = a cli arg value, or the whole of stdin when the value is the `@stdin` sentinel
 * .why = push and queue set both take a body that may arrive by pipe; one reader holds the rule
 */
export const getOneArgOrStdinText = (
  input: { raw: string | null },
  context: { readStdin: () => string } = { readStdin: getOneStdinText },
): string | null => {
  if (input.raw === '@stdin') return context.readStdin();
  return input.raw;
};

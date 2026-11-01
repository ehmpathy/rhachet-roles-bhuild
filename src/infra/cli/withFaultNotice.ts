/**
 * .what = run a step; on a throw, print a notice to stderr, then rethrow as is
 * .why = a cli step whose fault leaves a known state (e.g. a push already saved) tells the
 *        caller that state before the error, so the fix + retry is plain; no fault is hidden
 */
export const withFaultNotice = async <T>(input: {
  logic: () => Promise<T>;
  notice: string;
}): Promise<T> => {
  try {
    return await input.logic();
  } catch (error) {
    console.error(`${input.notice}\n`);
    throw error;
  }
};

/**
 * .what = await a step, but no longer than a bound: its value, or `expired`
 * .why = a step with no timeout of its own (a vault sdk call) must still end inside the drain
 *        deadline; past the bound the drain moves on, and the late result is never used
 *
 * .note = the step itself is not cancelled; a step that can be killed (a shell) also takes
 *         the bound as its own timeout, so it does not run on past it
 */
export const getOneRaceWithinBound = async <T>(input: {
  step: Promise<T>;
  bound: { milliseconds: number };
}): Promise<{ value: T } | { expired: true }> => {
  // a timer that settles as expired once the bound passes
  const timer: { handle: NodeJS.Timeout | null } = { handle: null };
  const expiry = new Promise<{ expired: true }>((settle) => {
    timer.handle = setTimeout(
      () => settle({ expired: true }),
      Math.max(0, input.bound.milliseconds),
    );
  });

  // whichever settles first wins; the timer never outlives the race
  try {
    return await Promise.race([
      input.step.then((value) => ({ value })),
      expiry,
    ]);
  } finally {
    if (timer.handle) clearTimeout(timer.handle);
  }
};

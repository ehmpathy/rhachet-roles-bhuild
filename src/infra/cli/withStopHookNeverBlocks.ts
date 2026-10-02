import { BadRequestError } from 'helpful-errors';

/**
 * .what = in a claude stop hook run, report a constraint under its own header, and exit 1
 * .why = a claude stop hook blocks the stop on exit 2, and the cli maps a constraint to
 *        exit 2; so a never-block promise must be held by this wrapper, not left to which
 *        error classes the wrapped logic happens to throw
 *
 * .note = the glyph and the exit code disagree here on purpose, as in a PreToolUse hook
 *         (rule.require.qualified-error-headers): the header keeps `✋ ConstraintError:`, so the
 *         human knows the caller must fix it; the exit is 1, so the stop is never blocked.
 *         the stop hook run is read from argv before any parse, so a parse fault is caught too
 */
export const withStopHookNeverBlocks =
  (
    logic: () => Promise<void>,
    options?: {
      argv?: string[];
      flag?: string;
      log?: (line: string) => void;
      exit?: (code: number) => void;
    },
  ) =>
  async (): Promise<void> => {
    try {
      await logic();
    } catch (error) {
      // outside the stop hook, errors pass through as they are
      const argv = options?.argv ?? process.argv;
      const isStopHookRun = argv.includes(options?.flag ?? 'hook.onStop');
      if (!isStopHookRun) throw error;

      // a malfunction already exits 1; pass it through as it is
      if (!(error instanceof BadRequestError)) throw error;

      // a constraint: keep its header, exit 1 so the stop is not blocked
      const log = options?.log ?? ((line: string) => console.error(line));
      const exit = options?.exit ?? ((code: number) => process.exit(code));
      const prefix = error.message.includes('✋') ? '' : '✋ ';
      log(`${prefix}${error.message}`);
      exit(1);
    }
  };

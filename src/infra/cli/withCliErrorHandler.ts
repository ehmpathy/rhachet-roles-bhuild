import { BadRequestError } from 'helpful-errors';

/**
 * .what = wraps a cli entry point with friendly error output
 * .why = catches BadRequestError and prints message to stderr with exit code 2
 *        instead of a full stack trace dump
 */
export const withCliErrorHandler = (input: {
  logic: () => Promise<void>;
}): Promise<void> =>
  input.logic().catch((error: unknown) => {
    // handle bad request errors with clean output
    if (error instanceof BadRequestError) {
      console.error(`\n⛈️  ${error.message}\n`);
      process.exit(2);
    }

    // rethrow unexpected errors (full stack trace is useful for those)
    throw error;
  });

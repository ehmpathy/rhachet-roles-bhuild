import { given, then, when } from 'test-fns';

import { asExecErrorMessage } from './asExecErrorMessage';

/**
 * .what = unit tests for asExecErrorMessage
 * .why = locks the duck-typed decode so every exec catch reads the cause one way,
 *        even the cross-realm Error that `instanceof Error` would miss
 */
describe('asExecErrorMessage', () => {
  given('[case1] a standard Error with a message', () => {
    when('[t0] extracted', () => {
      then('returns the message string verbatim', () => {
        const error = new Error(
          'Command failed: rhx keyrack unlock\nhost manifest not found',
        );
        expect(asExecErrorMessage({ error })).toEqual(
          'Command failed: rhx keyrack unlock\nhost manifest not found',
        );
      });
    });
  });

  given('[case2] a cross-realm error-like object (no Error prototype)', () => {
    when('[t0] extracted', () => {
      then(
        'reads .message duck-typed (what instanceof Error would miss)',
        () => {
          // a child_process exec rejection is not an `instanceof Error` in the
          // test realm; a plain object with a string .message models it
          const error = {
            message: 'Command failed: gh issue create',
            stderr: 'HTTP 401',
          };
          expect(asExecErrorMessage({ error })).toEqual(
            'Command failed: gh issue create',
          );
        },
      );
    });
  });

  given('[case3] a non-error value with no string .message', () => {
    when('[t0] extracted', () => {
      then('falls back to String(error)', () => {
        expect(asExecErrorMessage({ error: 'raw string reason' })).toEqual(
          'raw string reason',
        );
        expect(asExecErrorMessage({ error: null })).toEqual('null');
        expect(asExecErrorMessage({ error: { code: 1 } })).toEqual(
          '[object Object]',
        );
      });
    });
  });
});

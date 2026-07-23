/**
 * .what = extract the message string from a shell exec rejection
 * .why = a child_process exec rejection is a cross-realm Error, so `instanceof
 *   Error` misses it and a bare cast would leak a noisy `Error: ...` bubble. this
 *   reads `.message` duck-typed (with a String(error) fallback) so every exec
 *   catch across the radio auth path decodes the cause one way.
 *
 * .note = deliberately does NOT strip the exec library's `Command failed:` prefix.
 *   callers that render the cause in a headline strip it themselves; callers that
 *   keep the raw cause in metadata want it intact. the strip is a caller concern,
 *   not this transformer's.
 */
export const asExecErrorMessage = (input: { error: unknown }): string =>
  typeof (input.error as { message?: unknown } | null)?.message === 'string'
    ? (input.error as { message: string }).message
    : String(input.error);

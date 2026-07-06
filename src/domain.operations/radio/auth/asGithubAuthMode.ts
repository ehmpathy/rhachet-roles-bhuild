/**
 * .what = cast a raw --auth string to a typed github auth mode
 * .why = one place owns the auth-arg grammar; keeps getGithubTokenByAuthArg a
 *        narrative — callers branch on kind, the regex parse lives here
 */
export const asGithubAuthMode = (input: {
  auth: string;
}):
  | { kind: 'via-keyrack'; owner: string }
  | { kind: 'shx'; command: string }
  | { kind: 'env'; envVar: string }
  | { kind: 'as-human' }
  | { kind: 'unknown'; raw: string } => {
  const { auth } = input;

  // as-robot:via-keyrack(owner) — token from keyrack
  const keyrackMatch = auth.match(/^as-robot:via-keyrack\((.+)\)$/);
  if (keyrackMatch) return { kind: 'via-keyrack', owner: keyrackMatch[1]! };

  // as-robot:shx(command) — token from a shell command
  const shxMatch = auth.match(/^as-robot:shx\((.+)\)$/);
  if (shxMatch) return { kind: 'shx', command: shxMatch[1]! };

  // as-robot:env(VAR) — token from an env var
  const envMatch = auth.match(/^as-robot:env\((.+)\)$/);
  if (envMatch) return { kind: 'env', envVar: envMatch[1]! };

  // as-human — gh cli logged-in session
  if (auth === 'as-human') return { kind: 'as-human' };

  // no grammar matched — unrecognized mode
  return { kind: 'unknown', raw: auth };
};

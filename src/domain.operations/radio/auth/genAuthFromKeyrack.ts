import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { keyrack } from 'rhachet/keyrack';

/**
 * .what = shell executor interface
 * .why = defines shape expected by domain.operations without infra import
 */
type ShellExecutor = (
  command: string,
) => Promise<{ stdout: string; stderr: string }>;

/**
 * .what = generate a granted github token from keyrack (get-or-unlock)
 * .why = centralizes keyrack-based auth for radio skills and keeps humans in a
 *        pit of success when the grant is not immediately available
 *
 * .name = gen (not get) because on the locked path this findserts the grant: it
 *         auto-unlocks the vault (a write) to make the token available. the
 *         side effect is intentional and idempotent, so the verb is gen.
 *
 * .behavior by grant status
 *   - granted → return the token
 *   - locked  → auto-unlock via cli, emit a note, retry; still not granted → MalfunctionError
 *   - absent  → ConstraintError that names set-the-key and the --auth as-human fallback
 *   - blocked (or any other) → MalfunctionError that forwards raw keyrack stdout
 *
 * .idempotent = yes. the unlock (`rhx keyrack unlock`) is a no-op when the key is
 *   already unlocked, and a whole-op retry re-checks status first (granted → return),
 *   so the unlock never double-fires.
 *
 * .throws
 *   - ConstraintError when the key was never set (absent) — caller must choose a fix
 *   - MalfunctionError when the key is set but cannot be granted (locked-after-unlock, blocked)
 */
export const genAuthFromKeyrack = async (
  input: {
    owner: string;
    env: string;
    key: string;
  },
  context: { shx: ShellExecutor },
): Promise<{ token: string }> => {
  // first attempt to grant the key from unlocked sources
  const first = await keyrack.get({
    for: { key: input.key },
    env: input.env,
    owner: input.owner,
  });

  // happy path — key already granted
  if (first.attempt.status === 'granted')
    return { token: first.attempt.grant.key.secret };

  // absent — key was never set; name the set-the-key fix, plus as-human when allowed
  if (first.attempt.status === 'absent')
    throw new ConstraintError(
      [
        `key is not set: ${input.key}`,
        `  • set the github token: rhx keyrack set --owner ${input.owner} --key ${input.key} --env ${input.env}`,
        `  • or re-run as human: --auth as-human`,
      ].join('\n'),
      { owner: input.owner, env: input.env, key: input.key },
    );

  // locked — vault holds the key but it is not unlocked; auto-unlock, then retry
  if (first.attempt.status === 'locked') {
    // auto-unlock via cli (the keyrack sdk exposes no programmatic unlock)
    await context.shx(
      `rhx keyrack unlock --owner ${input.owner} --env ${input.env} --key ${input.key}`,
    );

    // emit a one-line note for observability
    console.log('🔓 unlocked keyrack');

    // retry the grant now that the vault should be unlocked
    const second = await keyrack.get({
      for: { key: input.key },
      env: input.env,
      owner: input.owner,
    });
    if (second.attempt.status === 'granted')
      return { token: second.attempt.grant.key.secret };

    // still not granted after unlock — forward raw keyrack stdout as a malfunction
    throw new MalfunctionError(`keyrack:\n${second.emit.stdout}`, {
      status: second.attempt.status,
      owner: input.owner,
      env: input.env,
      key: input.key,
    });
  }

  // blocked (or any other non-granted status) — forward raw keyrack stdout as a malfunction
  throw new MalfunctionError(`keyrack:\n${first.emit.stdout}`, {
    status: first.attempt.status,
    owner: input.owner,
    env: input.env,
    key: input.key,
  });
};

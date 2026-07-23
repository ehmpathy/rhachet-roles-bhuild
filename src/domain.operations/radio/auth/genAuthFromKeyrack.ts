import { ConstraintError } from 'helpful-errors';
import { keyrack } from 'rhachet/keyrack';

import { asExecErrorMessage } from '../../../infra/shell/asExecErrorMessage';
import { getKeyrackAuthFailureMessage } from './getKeyrackAuthFailureMessage';

/**
 * .what = shell executor interface
 * .why = defines shape expected by domain.operations without infra import
 */
type ShellExecutor = (
  command: string,
) => Promise<{ stdout: string; stderr: string }>;

/**
 * .what = the keyrack grant lookup, as an injectable seam
 * .why = keyrack.get is a remote boundary (it reads credentials from a vault). a
 *        type derived off the real export holds the shape in lockstep with the
 *        sdk, and a context seam lets unit tests pass a fake instead of a module
 *        mock (per rule.forbid.unit.remote-boundaries). defaults to the real
 *        keyrack.get in prod, so callers need not wire it.
 */
type KeyrackGet = typeof keyrack.get;

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
 *   - locked  → auto-unlock via cli, emit a note, retry; still not granted → ConstraintError
 *   - absent  → ConstraintError
 *   - blocked (or any other) → ConstraintError
 *
 * .note = every non-granted outcome is a ConstraintError (✋), not a MalfunctionError (💥).
 *   a keyrack auth issue is caller-fixable — the caller can re-run `--auth as-human` now
 *   and fix the robot token later — so it must not block progress on perfection. the raw
 *   keyrack stdout is preserved in the error metadata for debug.
 *
 * .idempotent = yes. the unlock (`rhx keyrack unlock`) is a no-op when the key is
 *   already unlocked, and a whole-op retry re-checks status first (granted → return),
 *   so the unlock never double-fires.
 *
 * .throws
 *   - ConstraintError on any non-granted status (absent, locked-after-unlock, blocked):
 *     a graceful nudge that names the --auth as-human unblock and the keyrack-set fix
 *   - ConstraintError when the auto-unlock command itself exits non-zero (absent host
 *     manifest, unfilled credential, rhx not on PATH, unreachable vault): the same
 *     graceful nudge, with the raw unlock cause preserved in metadata.unlockFailure
 */
export const genAuthFromKeyrack = async (
  input: {
    owner: string;
    env: string;
    key: string;
  },
  context: { shx: ShellExecutor; keyrackGet?: KeyrackGet },
): Promise<{ token: string }> => {
  // pick the keyrack seam — a test may inject a fake; prod uses the real sdk.
  // bound to keyrack so the sdk keeps its own `this` when called through the seam.
  const keyrackGet = context.keyrackGet ?? keyrack.get.bind(keyrack);

  // first attempt to grant the key from unlocked sources
  const first = await keyrackGet({
    for: { key: input.key },
    env: input.env,
    owner: input.owner,
  });

  // happy path — key already granted
  if (first.attempt.status === 'granted')
    return { token: first.attempt.grant.key.secret };

  // absent — key was never set; graceful nudge to as-human now, keyrack-set later.
  // note: no raw keyrack stdout in metadata — "absent" is self-explanatory, and
  // the real keyrack stdout would make the integration snapshot non-deterministic
  if (first.attempt.status === 'absent')
    throw new ConstraintError(
      getKeyrackAuthFailureMessage({
        owner: input.owner,
        env: input.env,
        key: input.key,
        status: 'absent',
      }),
      { owner: input.owner, env: input.env, key: input.key },
    );

  // locked — vault holds the key but it is not unlocked; auto-unlock, then retry
  if (first.attempt.status === 'locked') {
    // auto-unlock via cli (the keyrack sdk exposes no programmatic unlock).
    // if the unlock command ITSELF exits non-zero (absent host manifest, unfilled
    // credential, rhx not on PATH, unreachable vault) — as opposed to a success that
    // leaves the key still-locked — translate the raw exec rejection into the same
    // graceful ✋ nudge. the wish forbids ungraceful stderr on the default-keyrack
    // path, and this is that path one layer earlier. raw cause kept in metadata.
    await context
      .shx(
        `rhx keyrack unlock --owner ${input.owner} --env ${input.env} --key ${input.key}`,
      )
      .catch((error: unknown) => {
        // decode the cross-realm exec cause one way (shared infra transformer)
        const rawCause = asExecErrorMessage({ error });
        throw new ConstraintError(
          getKeyrackAuthFailureMessage({
            owner: input.owner,
            env: input.env,
            key: input.key,
            status: 'locked',
          }),
          {
            status: 'locked',
            owner: input.owner,
            env: input.env,
            key: input.key,
            unlockFailure: rawCause,
          },
        );
      });

    // emit a one-line note for observability
    console.log('🔓 unlocked keyrack');

    // retry the grant now that the vault should be unlocked
    const second = await keyrackGet({
      for: { key: input.key },
      env: input.env,
      owner: input.owner,
    });
    if (second.attempt.status === 'granted')
      return { token: second.attempt.grant.key.secret };

    // still not granted after unlock — graceful nudge, raw stdout kept in metadata
    throw new ConstraintError(
      getKeyrackAuthFailureMessage({
        owner: input.owner,
        env: input.env,
        key: input.key,
        status: second.attempt.status,
      }),
      {
        status: second.attempt.status,
        owner: input.owner,
        env: input.env,
        key: input.key,
        keyrack: second.emit.stdout,
      },
    );
  }

  // blocked (or any other non-granted status) — graceful nudge, raw stdout in metadata
  throw new ConstraintError(
    getKeyrackAuthFailureMessage({
      owner: input.owner,
      env: input.env,
      key: input.key,
      status: first.attempt.status,
    }),
    {
      status: first.attempt.status,
      owner: input.owner,
      env: input.env,
      key: input.key,
      keyrack: first.emit.stdout,
    },
  );
};

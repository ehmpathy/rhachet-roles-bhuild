import { ConstraintError } from 'helpful-errors';
import type { keyrack } from 'rhachet/keyrack';

import { asExecErrorMessage } from '../../../infra/shell/asExecErrorMessage';
import { asGithubAuthMode } from './asGithubAuthMode';
import type { EhmpathSpot } from './EhmpathSpot';
import { genAuthFromKeyrack } from './genAuthFromKeyrack';
import { getEhmpathTokenByVia } from './getEhmpathTokenByVia';
import { getGithubTokenByAmbientFirst } from './getGithubTokenByAmbientFirst';
import { isTestEnv } from './isTestEnv';

/**
 * .what = get github token from auth argument
 * .why = centralizes auth derivation logic for gh.issues channel
 *
 * .note
 *   - with no --auth, ambient-first (getGithubTokenByAmbientFirst): an ehmpath box sends with
 *     its gh login, a human's box sends as-human, a box with no git email reads keyrack
 *   - the shx(...) pattern enables token retrieval from adhoc remote sources,
 *     such as 1password, vault, aws secrets manager, or any cli tool that
 *     outputs a token
 *
 * .returns
 *   - { token: string; role: 'as-robot' } when token is available
 *   - { token: null; role: 'as-human' } when as-human (use gh cli auto login)
 *   - ehmpathSpot: the spot that paid where two could have (as-ehmpath); null for every
 *     value that names one source, so a caller shows it only where it tells the reader aught
 *
 * .throws
 *   - ConstraintError when as-robot:env(VAR) but VAR not set
 *   - ConstraintError when as-robot:shx(...) command fails or has no output
 *   - ConstraintError when as-human in test environment (tests must use explicit tokens)
 *   - ConstraintError when the --auth mode is unrecognized
 *   - (via-keyrack delegates to genAuthFromKeyrack: ConstraintError on any non-granted status — absent, locked, blocked)
 *   - (as-ehmpath* delegates to getEhmpathTokenByVia: ConstraintError that names each spot it checked)
 *
 * .note = every caller-fix failure throws ConstraintError (renders ✋), so the
 *   whole auth flow speaks one visual language: ✋ = fix your config, 💥 = server fault.
 */
export const getGithubTokenByAuthArg = async (
  input: { auth: string | null },
  context: {
    env: NodeJS.ProcessEnv;
    shx: (command: string) => Promise<{ stdout: string; stderr: string }>;
    // optional keyrack seam — forwarded to genAuthFromKeyrack. prod leaves it
    // unset (the real keyrack.get is used); tests inject a fake to exercise the
    // keyrack-failure nudge deterministically without a real vault.
    keyrackGet?: typeof keyrack.get;
  },
): Promise<
  | { token: string; role: 'as-robot'; ehmpathSpot: EhmpathSpot | null }
  | { token: null; role: 'as-human'; ehmpathSpot: null }
> => {
  // no --auth: the box's own identity first (ehmpath → its gh login; human → as-human)
  if (input.auth === null) return getGithubTokenByAmbientFirst({}, context);
  const auth = input.auth;

  // parse the auth arg into a typed mode, then branch on it
  const mode = asGithubAuthMode({ auth });

  // via-keyrack — token from keyrack (auto-unlock handled downstream)
  // .note = only `owner` is caller-configurable (via `--auth via-keyrack(owner)`).
  //   `env` and `key` are intentionally fixed: the beaver robot token lives at one
  //   well-known coordinate (env=prep, key=EHMPATH_BEAVER_GITHUB_TOKEN) across all
  //   owners, so a knob for them would invite misconfiguration for no usecase.
  if (mode.kind === 'via-keyrack') {
    const { token } = await genAuthFromKeyrack(
      {
        owner: mode.owner,
        env: 'prep',
        key: 'EHMPATH_BEAVER_GITHUB_TOKEN',
        org: null,
      },
      { shx: context.shx, keyrackGet: context.keyrackGet },
    );
    return { token, role: 'as-robot', ehmpathSpot: null };
  }

  // shx — token from a shell command (1password, vault, aws secrets, etc.)
  if (mode.kind === 'shx') {
    // run the caller's command; a failure here is a caller-config constraint,
    // so wrap the bare shell error with the command + a hint (not a raw bubble).
    // note: extract the cause without an `instanceof Error` guard — the real
    // execAsync rejection is a cross-realm Error, so `instanceof` would miss it
    // and leak the raw "Command failed" bubble the reviewer flagged.
    const result = await context.shx(mode.command).catch((error: unknown) => {
      // decode the cross-realm exec cause one way (shared infra transformer)
      const rawCause = asExecErrorMessage({ error });
      // strip the exec library's own `Command failed:` prefix so the rendered
      // message reads `command failed: exit 1`, not `command failed: Command failed: exit 1`
      const cause = rawCause.trim().replace(/^Command failed:\s*/i, '');
      throw new ConstraintError(
        `--auth as-robot:shx(...) command failed: ${cause}`,
        {
          command: mode.command,
          hint: 'check the command runs and prints a token to stdout',
        },
      );
    });

    const tokenValue = result.stdout.trim();
    if (!tokenValue)
      throw new ConstraintError(
        `--auth as-robot:shx(...) command produced no output. stderr: ${result.stderr.trim() || '(empty)'}`,
        { command: mode.command, stderr: result.stderr },
      );
    return { token: tokenValue, role: 'as-robot', ehmpathSpot: null };
  }

  // env — explicit token from an env var
  if (mode.kind === 'env') {
    const tokenValue = context.env[mode.envVar];
    if (!tokenValue)
      throw new ConstraintError(
        `--auth as-robot:env(${mode.envVar}) specified but ${mode.envVar} is not set`,
        { envVar: mode.envVar, hint: `set ${mode.envVar} in the environment` },
      );
    return { token: tokenValue, role: 'as-robot', ehmpathSpot: null };
  }

  // as-ehmpath — the robot token: keyrack, the ehmpath ambient login, or keyrack then ambient
  if (mode.kind === 'as-ehmpath') {
    const { token, spot } = await getEhmpathTokenByVia(
      { auth, via: mode.via },
      context,
    );
    return {
      token,
      role: 'as-robot',
      ehmpathSpot: mode.via === 'either' ? spot : null,
    };
  }

  // as-human — explicit gh cli intent, takes precedence over GITHUB_TOKEN
  if (mode.kind === 'as-human') {
    // failfast in test env — tests must use explicit tokens, not gh cli auto login
    if (isTestEnv({ env: context.env }))
      throw new ConstraintError(
        '--auth as-human is forbidden in test environment. use --auth as-robot:env(TOKEN_VAR) or --auth as-robot:shx(command) instead.',
        { auth },
      );
    return { token: null, role: 'as-human', ehmpathSpot: null };
  }

  // unrecognized auth mode
  throw new ConstraintError(
    [
      `unrecognized --auth mode: ${mode.raw}`,
      '',
      'supported modes',
      '├─ as-ehmpath                    keyrack, then the gh login (ehmpath email only)',
      '├─ as-ehmpath-via-keyrack        keyrack only',
      '├─ as-ehmpath-via-ambient        the gh login only (ehmpath email only)',
      '├─ as-robot:via-keyrack(owner)   token from keyrack (default owner: ehmpath)',
      '├─ as-robot:shx(command)         token from the stdout of a shell command',
      '├─ as-robot:env(VAR)             token from an environment variable',
      '└─ as-human                      the gh login, any identity (interactive)',
    ].join('\n'),
    { auth: mode.raw },
  );
};

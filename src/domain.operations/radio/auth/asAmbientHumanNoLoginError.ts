import { ConstraintError } from 'helpful-errors';

/**
 * .what = the miss of the default on a human's box whose gh holds no stored login
 * .why = the default sends as-human there; with no stored login, gh would fail at the send with
 *        no tree, so the miss is raised at the derive with its fix, beside the ehmpath misses
 *
 * .note = envTokenName names an env token the box holds (GH_TOKEN or GITHUB_TOKEN), else null.
 *         an as-human send strips both, so a box that authenticates by env token alone has gh
 *         auth that the default cannot use; the miss says so, and names the value that sends it
 */
export const asAmbientHumanNoLoginError = (input: {
  email: string;
  envTokenName: string | null;
}) =>
  new ConstraintError(
    input.envTokenName
      ? `the default auth (no --auth) reads a human email (${input.email}), so it sends as-human; but gh holds no stored login, and an as-human send never uses the env ${input.envTokenName}`
      : `the default auth (no --auth) reads a human email (${input.email}), so it sends as-human; but gh holds no login`,
    {
      auth: null,
      email: input.email,
      envTokenName: input.envTokenName,
      hint: input.envTokenName
        ? `send with that token, on purpose: --auth 'as-robot:env(${input.envTokenName})'; or as the robot: --auth as-ehmpath-via-keyrack; or log the human in: gh auth login`
        : 'log the human in with `gh auth login`, or name the auth: --auth as-ehmpath-via-keyrack',
    },
  );

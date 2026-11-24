/**
 * .what = the one fix for a keyrack grant that did not arrive, per its status
 * .why = the fix differs by status, and both the keyrack nudge and the as-ehmpath miss
 *        print it; one home keeps the two from drift
 *
 * .note
 *   - locked → `rhx keyrack unlock`. the vault holds the key but it is sealed, and the
 *     auto-unlock did not clear it (a yubikey/tty gate with no terminal)
 *   - absent → `rhx keyrack set`. the key was never stored
 *   - blocked (or any other) → `rhx keyrack status`. a policy block is not fixed by
 *     unlock or set, so point the human at the status
 */
export const asKeyrackRobotTokenFix = (input: {
  owner: string;
  env: string;
  key: string;
  status: string;
}): string => {
  if (input.status === 'locked')
    return `unlock the robot token: rhx keyrack unlock --owner ${input.owner} --key ${input.key} --env ${input.env}`;
  if (input.status === 'absent')
    return `set the robot token: rhx keyrack set --owner ${input.owner} --key ${input.key} --env ${input.env}`;
  return `inspect the block: rhx keyrack status --owner ${input.owner}`;
};

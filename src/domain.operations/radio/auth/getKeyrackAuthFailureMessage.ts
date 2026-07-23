/**
 * .what = build the graceful keyrack auth-failure nudge
 * .why = one consistent ✋ shape across all keyrack failure modes
 *        (absent / locked / blocked) so a caller who hit a default-keyrack
 *        auth issue always sees the same first move — re-run as human now — plus
 *        a SECOND, status-specific fix for the robot token later. keyrack is a
 *        convenience, not a gate.
 *
 * .note = the second bullet is tailored to the status, because the fix differs:
 *   - locked → `rhx keyrack unlock`. the vault holds the key but it is sealed.
 *     genAuthFromKeyrack already auto-ran unlock non-interactively and it did not
 *     clear the lock (typically because unlock is yubikey/tty-gated and there was
 *     no terminal), so a MANUAL unlock in the human's own terminal is the fix —
 *     `rhx keyrack set` would not help a present-but-locked key.
 *   - absent → `rhx keyrack set`. the key was never stored, so store it.
 *   - blocked (or any other) → `rhx keyrack status`. a firewall/policy block is
 *     not fixed by unlock or set, so point the human at the status to inspect why.
 *
 * .note = pairs with the ConstraintError (✋) class in genAuthFromKeyrack; the
 *   raw keyrack stdout is preserved in the error metadata, not this headline
 */
export const getKeyrackAuthFailureMessage = (input: {
  owner: string;
  env: string;
  key: string;
  status: string;
}): string => {
  const header = `github auth via keyrack failed: ${input.key} (status: ${input.status})`;
  const humanBullet = `  • unblock now — re-run as human: --auth as-human`;

  // locked — present but sealed; a manual (interactive) unlock is the fix
  if (input.status === 'locked')
    return [
      header,
      humanBullet,
      `  • or unlock the robot token: rhx keyrack unlock --owner ${input.owner} --key ${input.key} --env ${input.env}`,
    ].join('\n');

  // absent — never stored; set it
  if (input.status === 'absent')
    return [
      header,
      humanBullet,
      `  • or set the robot token: rhx keyrack set --owner ${input.owner} --key ${input.key} --env ${input.env}`,
    ].join('\n');

  // blocked (or any other) — a firewall/policy block; inspect the status
  return [
    header,
    humanBullet,
    `  • or inspect the block: rhx keyrack status --owner ${input.owner}`,
  ].join('\n');
};

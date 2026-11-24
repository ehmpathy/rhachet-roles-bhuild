import { asKeyrackRobotTokenFix } from './asKeyrackRobotTokenFix';

/**
 * .what = build the graceful keyrack auth-failure nudge
 * .why = one consistent ✋ shape across all keyrack failure modes
 *        (absent / locked / blocked) so a caller who hit a default-keyrack
 *        auth issue always sees the same first move — re-run as human now — plus
 *        a SECOND, status-specific fix for the robot token later. keyrack is a
 *        convenience, not a gate.
 *
 * .note = the second bullet is tailored to the status (see asKeyrackRobotTokenFix)
 *
 * .note = pairs with the ConstraintError (✋) class in genAuthFromKeyrack; the
 *   raw keyrack stdout is preserved in the error metadata, not this headline
 */
export const getKeyrackAuthFailureMessage = (input: {
  owner: string;
  env: string;
  key: string;
  status: string;
}): string =>
  [
    `github auth via keyrack failed: ${input.key} (status: ${input.status})`,
    `  • unblock now — re-run as human: --auth as-human`,
    `  • or ${asKeyrackRobotTokenFix(input)}`,
  ].join('\n');

import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

/**
 * .what = the reasons another auth may cure: the robot may not write here, cannot see the
 *         repo, or holds no usable token
 * .why = these name `queue set --auth as-human` as their fix; a wall or a gate does not
 */
const REASONS_CURED_BY_AUTH = new Set([
  'upstream:access',
  'upstream:not-found',
  'upstream:401',
  'upstream:auth',
]);

/**
 * .what = is this fault the test-env guard's refusal of as-human
 * .why = there the gh login is not the cause, so "check the gh login" would mislead
 */
const isRadioTestEnvGuardFault = (input: { detail: string }): boolean =>
  /as-human is forbidden in test environment/.test(input.detail);

/**
 * .what = the next moves for one set-aside record, as copy-paste commands
 * .why = a record set aside must name how to land it (amend its auth) or let it go
 *        (drop it, with a why), so no human has to move a file by hand (#599)
 *
 * .note = a gate-held or wall-held record names no fix here: the lift or the wait is its fix
 * .note = an amend lands one record, chosen per record; no fix line sends the whole queue under
 *         one auth, since a record can arrive by a merge and the human chooses each github write
 *         (F3). `drain --auth` stays in --help, for a human who means it
 * .note = detail is the fault text the record was set aside on, when known (null: none)
 * .note = authOverride is the `drain --auth` the record was just sent under (null: none);
 *         the auth tried decides the fix, so an as-human override never suggests as-human
 */
export const asRadioQueueFixLines = (input: {
  record: RadioTaskRecord;
  authOverride: string | null;
  detail: string | null;
}): string[] => {
  const { key, reason } = input.record;
  const auth = input.authOverride ?? input.record.auth;
  const drop = `or drop it: rhx radio.task.queue del --uuid ${key} --why "<why>"`;

  // as-human refused by the test-env guard: the gh login is fine, so name the guard and a robot auth
  if (input.detail && isRadioTestEnvGuardFault({ detail: input.detail }))
    return [
      `the test-env guard refuses as-human; amend it to a robot auth: rhx radio.task.queue set --uuid ${key} --auth 'as-robot:env(GH_TOKEN)'`,
      drop,
    ];

  // already as-human: a second as-human amend would loop; the gh login is the fix
  if (reason && REASONS_CURED_BY_AUTH.has(reason) && auth === 'as-human')
    return [
      `check the gh login on this host: gh auth status (else: gh auth login), then: rhx radio.task.queue drain`,
      drop,
    ];
  if (reason && REASONS_CURED_BY_AUTH.has(reason))
    return [
      `amend it: rhx radio.task.queue set --uuid ${key} --auth as-human (needs a gh login on this host)`,
      drop,
    ];
  // an unknown fault: its text is never kept on disk (F10), so a read with no detail names
  // the drain that prints it again
  if (reason === 'upstream:fault' && input.detail === null)
    return [
      'retry it and print its fault: rhx radio.task.queue drain (this sends every held record whose gate is open)',
      drop,
    ];
  if (reason === 'upstream:fault') return [drop];
  return [];
};

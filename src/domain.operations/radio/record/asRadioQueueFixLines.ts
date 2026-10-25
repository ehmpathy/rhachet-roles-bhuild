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
 * .what = the next moves for one set-aside record, as copy-paste commands
 * .why = a record set aside must name how to land it (amend its auth) or let it go
 *        (drop it, with a why), so no human has to move a file by hand (#599)
 *
 * .note = a gate-held or wall-held record names no fix here: the lift or the wait is its fix
 */
export const asRadioQueueFixLines = (input: {
  record: RadioTaskRecord;
}): string[] => {
  const { key, reason } = input.record;
  const drop = `or drop it: rhx radio.task.queue del --key ${key} --why "<why>"`;
  if (reason && REASONS_CURED_BY_AUTH.has(reason))
    return [
      `amend it: rhx radio.task.queue set --key ${key} --auth as-human (needs a gh login on this host)`,
      drop,
    ];
  if (reason === 'upstream:fault') return [drop];
  return [];
};

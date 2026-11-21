import type { RadioTaskRecord } from '@src/domain.objects/RadioTaskRecord';

import { isRadioPromiseHoldReason } from '../promise/isRadioPromiseHoldReason';
import { RADIO_PROMISE_PUBLIC_REPO } from '../promise/RADIO_PROMISE_PUBLIC_REPO';
import type { RadioPromiseHoldReason } from '../promise/RadioPromiseHoldReason';
import { isRadioUpstreamReasonCuredByAuth } from './isRadioUpstreamReasonCuredByAuth';

/**
 * .what = the next moves for a record the promise gate holds
 * .why = its text may not go public unchecked: the fix reads the full text at its record file
 *        (`get` shows the title only), offers a scrub, then the vouch, then the drop
 *
 * .note = an unreadable read is no flake (a wall halts the drain instead), so no retry line;
 *         an auth-cured read leads with the as-human amend, since a private repo then sends
 *         with no promise
 */
const asRadioPromiseFixLines = (input: {
  reason: RadioPromiseHoldReason;
  key: string;
  recordPath: string;
  drop: string;
}): string[] => {
  const lines = [
    `check its title and body at ${input.recordPath}: no source org, repo, route path, pr / issue numbers, internal names, or business detail`,
    `scrub the body if need be: rhx radio.task.queue set --uuid ${input.key} --description @stdin`,
    `once checked, vouch: rhx radio.task.queue drain --promise ${RADIO_PROMISE_PUBLIC_REPO} (it promises every held public record)`,
    input.drop,
  ];
  switch (input.reason) {
    case 'public-repo:unpromised':
      return lines;
    case 'public-repo:unreadable':
      // the row above already says the read failed and the repo is treated as public
      return lines;
    case 'public-repo:unreadable-auth':
      return [
        `first, try another auth: rhx radio.task.queue set --uuid ${input.key} --auth as-human (a private repo then sends with no promise)`,
        ...lines,
      ];
  }
};

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
  recordPath: string;
  authOverride: string | null;
  detail: string | null;
}): string[] => {
  const { key, reason } = input.record;
  const auth = input.authOverride ?? input.record.auth;
  const drop = `or drop it: rhx radio.task.queue del --uuid ${key} --why "<why>"`;

  // held for its promise: read the text first, scrub it if need be, then vouch
  if (isRadioPromiseHoldReason(reason))
    return asRadioPromiseFixLines({
      reason,
      key,
      recordPath: input.recordPath,
      drop,
    });

  // as-human refused by the test-env guard: the gh login is fine, so name the guard and a robot auth
  if (input.detail && isRadioTestEnvGuardFault({ detail: input.detail }))
    return [
      `the test-env guard refuses as-human; amend it to a robot auth: rhx radio.task.queue set --uuid ${key} --auth 'as-robot:env(GH_TOKEN)'`,
      drop,
    ];

  // already as-human: a second as-human amend would loop; the gh login is the fix
  const isCuredByAuth = isRadioUpstreamReasonCuredByAuth({ reason });
  if (isCuredByAuth && auth === 'as-human')
    return [
      `check the gh login on this host: gh auth status (else: gh auth login), then: rhx radio.task.queue drain`,
      drop,
    ];
  if (isCuredByAuth)
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

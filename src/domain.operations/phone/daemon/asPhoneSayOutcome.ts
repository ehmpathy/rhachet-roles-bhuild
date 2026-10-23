import type { RhachetCloneSayRaw } from '@src/access/sdks/sdkRhachetClone';
import type { PhoneTextStatus } from '@src/domain.objects/phone/PhoneTextStatus';

import { asPhoneReasonOfPeerReach } from './asPhoneReasonOfPeerReach';

const REASON_OF_WITHHELD: Record<string, string> = {
  'modal-holds-focus': 'peer at a modal',
  'input-region-dirty': 'peer input box holds typed text',
  'focus-unrecognized': 'peer screen unrecognized',
};

/**
 * .what = reads one raw `clone say` result into a phone status
 * .why = rhachet reports a say in two channels and many verdicts; the phone has five statuses.
 *        the map is the vision's: a sure delivery is DELIVERED, a wait the peer can lift stays
 *        QUEUED, and an unconfirmed say is FAULTED, never retried, since a resend could say it
 *        twice
 *
 * .note = a say's absent clone, dead clone, and `withheld` all exit 2; the class is read from the
 *         stderr json, never from the exit code (Q10)
 * .note = a peer that does not exist never reaches a say: the daemon refuses it from the roster
 *         first. a clone that vanishes between the roster read and the say lands FAULTED here
 */
export const asPhoneSayOutcome = (input: {
  raw: RhachetCloneSayRaw;
}):
  | { status: Extract<PhoneTextStatus, 'DELIVERED'>; reason: null }
  | {
      status: Extract<PhoneTextStatus, 'QUEUED' | 'FAULTED'>;
      reason: string;
    } => {
  // success: the record rides stdout
  if (input.raw.exitCode === 0) {
    const record = asJsonObject({ text: input.raw.stdout });
    const verdict = asString(record?.verdict);
    if (verdict === 'released' || verdict === 'enqueued')
      return { status: 'DELIVERED', reason: null };
    return {
      status: 'FAULTED',
      reason:
        [verdict ?? 'unreadable', asString(record?.reason)]
          .filter(Boolean)
          .join(': ') || 'say returned no verdict',
    };
  }

  // failure: the error rides stderr; its record rides the metadata
  const error = asJsonObject({ text: input.raw.stderr });
  if (!error)
    return {
      status: 'FAULTED',
      reason: 'say failed; its output was unreadable',
    };
  const metadata = asJsonObjectValue(error.metadata);
  const message = asString(error.message) ?? '';
  const reachState =
    asString(error.reachState) ?? asString(metadata?.reachState);
  const verdict = asString(metadata?.verdict);
  const reasonOfSay = asString(metadata?.reason);

  // a dead or deaf clone may come back; the text waits, its state and rhachet's cause named
  if (reachState === 'DEAD' || reachState === 'DEAF')
    return {
      status: 'QUEUED',
      reason: asPhoneReasonOfPeerReach({
        reachState,
        reachCause:
          asString(error.reachCause) ?? asString(metadata?.reachCause),
      }),
    };

  // a withheld say waits for the peer's screen to clear; never forced
  if (verdict === 'withheld')
    return {
      status: 'QUEUED',
      reason:
        REASON_OF_WITHHELD[reasonOfSay ?? ''] ??
        `peer withheld it (${reasonOfSay ?? 'no reason'})`,
    };

  // all else could not be confirmed; a resend could duplicate, so the sender decides
  return {
    status: 'FAULTED',
    reason:
      [verdict, reasonOfSay].filter(Boolean).join(': ') ||
      message ||
      'say failed',
  };
};

/**
 * .what = the json object a stream holds, from its first `{` to its end; null if none parses
 * .why = a stream may carry an info line above its json
 */
const asJsonObject = (input: {
  text: string;
}): Record<string, unknown> | null => {
  const at = input.text.indexOf('{');
  if (at < 0) return null;
  try {
    return asJsonObjectValue(JSON.parse(input.text.slice(at)));
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};

/**
 * .what = the value as a plain object, or null
 */
const asJsonObjectValue = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : null;

/**
 * .what = the value as a string, or null
 */
const asString = (value: unknown): string | null =>
  typeof value === 'string' ? value : null;

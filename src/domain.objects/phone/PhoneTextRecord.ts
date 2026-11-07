import { DomainEntity } from 'domain-objects';

import type { PhoneTextStatus } from './PhoneTextStatus';

/**
 * .what = one text, as one clone's mailbox holds it
 * .why = the file is the queue and the audit trail at once: a dead daemon or a reboot loses no
 *        text, and a reader can check any claim from the files alone
 *
 * .note = the storage ordinal in the file name orders the mailbox; it is never a field, never
 *         printed, never accepted as a name (rule: no auto-incremented references)
 * .note = no clock field: order is the ordinal, "when" is a question the mtime answers
 */
interface PhoneTextRecord {
  /**
   * the text's one name, minted at send; shared by its `out` copy and every `in` copy
   */
  uuid: string;

  /**
   * out = this clone sent it; in = a peer sent it here, into this seat's inbox
   */
  way: 'out' | 'in';

  /**
   * the uuid of the group this text went to (null for a one-to-one text); the group record, with
   * its members, sits in the mailbox of every member
   */
  group: string | null;

  /**
   * the uuid of the text this one answers (null when it answers none)
   */
  re: string | null;

  /**
   * the sender, canonical address string
   */
  from: string;

  /**
   * the recipient, canonical address string
   *
   * .note = a seat, not a serial: a slug names whichever clone holds that seat when the daemon
   *         says it, so a text to `@:mechanic` reaches the mechanic revived under that slug. a
   *         clone with no slug is addressed by its serial, which no revive can take
   */
  to: string;

  /**
   * the words, byte for byte
   */
  what: string;

  /**
   * the fate of this copy
   *
   * .note = both copies run QUEUED → DELIVERED | REFUSED | FAULTED | WITHDRAWN. the `in` copy is
   *         the one the receiver tree's daemon claims and settles; each settle is mirrored onto
   *         the sender's `out` copy, so the sender's thread reads the fate of what it sent
   */
  status: PhoneTextStatus;

  /**
   * why it waits, or why it settled as it did (null once delivered clean)
   */
  reason: string | null;
}

class PhoneTextRecord
  extends DomainEntity<PhoneTextRecord>
  implements PhoneTextRecord
{
  public static unique = ['uuid', 'way'] as const;
  public static updatable = ['status', 'reason'] as const;
}

export { PhoneTextRecord };

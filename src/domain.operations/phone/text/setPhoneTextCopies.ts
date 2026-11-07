import { ConstraintError, MalfunctionError } from 'helpful-errors';
import { z } from 'zod';

import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import type { PhoneContext } from '../PhoneContext';
import { asPhoneErrorHeadline } from '../render/asPhoneErrorHeadline';

/**
 * .what = the answer a peer grove's inbox gives to a `put` of a text
 */
const schemaOfPutAnswer = z.object({
  outcome: z.enum(['QUEUED', 'REFUSED', 'NO_TREE', 'TWO_TREES']),
  reason: z.string().nullable().optional(),
});

/**
 * .what = what the send makes of a `put`: the grove's answer, or a fault of the connection
 */
type PhoneGrovePutAnswer =
  | z.infer<typeof schemaOfPutAnswer>
  | { outcome: 'FAULT'; reason: string };

/**
 * .what = writes one text's two copies: the sender's `out`, then the receiver seat's `in`
 * .why = the send writes into the receiver's inbox, and keeps no daemon of its own; the receiver
 *        tree's daemon says it from there. the `out` copy is the sender's thread, and mirrors
 *        each settle the receiver's daemon makes
 *
 * .note = the `out` copy is written first, so a crash between the two leaves a text the sender
 *         can see and withdraw, never an `in` copy with no sender's record of it
 * .note = a peer on this grove is written on disk; a peer on another grove is written through
 *         the grove connection, and a write the grove refuses or faults on settles the `out`
 *         copy at once, with the reason, so the sender's thread never shows a text no inbox holds
 */
export const setPhoneTextCopies = async (
  input: { record: PhoneTextRecord; peer: PhonePeer; self: PhoneSelf },
  context: Pick<PhoneContext, 'sdkGrove'>,
): Promise<PhoneMailboxEntry> => {
  const { record, peer, self } = input;

  // the sender's own copy
  const out = await daoPhoneMailbox.gen({
    treeDir: self.treeDir,
    clone: self.address.clone,
    record,
  });
  const recordIn = new PhoneTextRecord({ ...record, way: 'in' });

  // a peer on this grove: into its seat's inbox, on disk
  if (peer.treeDir !== null) {
    await daoPhoneMailbox.gen({
      treeDir: peer.treeDir,
      clone: peer.address.clone,
      record: recordIn,
    });
    return out;
  }

  // a peer on another grove: through the grove connection
  const answer: PhoneGrovePutAnswer = await context.sdkGrove
    .call({
      grove: peer.address.grove,
      tree: peer.address.tree,
      verb: 'put',
      payload: { kind: 'text', grove: peer.address.grove, record: recordIn },
    })
    .then((raw): PhoneGrovePutAnswer => {
      const parsed = schemaOfPutAnswer.safeParse(raw);
      if (parsed.success) return parsed.data;
      return {
        outcome: 'FAULT',
        reason: 'the grove answered an unknown shape',
      };
    })
    .catch((error: unknown): PhoneGrovePutAnswer => {
      // only the grove connection's own faults are held to this text; all else halts loud
      if (
        !(error instanceof MalfunctionError) &&
        !(error instanceof ConstraintError)
      )
        throw error;
      return {
        outcome: 'FAULT',
        reason: `the grove connection failed: ${asPhoneErrorHeadline({ error })}`,
      };
    });
  if (answer.outcome === 'QUEUED') return out;
  const reason = {
    REFUSED: answer.reason ?? `refused on ${peer.address.grove}`,
    NO_TREE: `no tree ${peer.address.tree} on ${peer.address.grove}`,
    TWO_TREES: `tree ${peer.address.tree} names two dirs on ${peer.address.grove}`,
    FAULT: answer.reason ?? 'the grove connection failed',
  }[answer.outcome];
  return daoPhoneMailbox.set({
    entry: out,
    status: answer.outcome === 'FAULT' ? 'FAULTED' : 'REFUSED',
    reason,
  });
};

import { basename } from 'path';

import { daoPhoneMailbox } from '@src/access/daos/daoPhoneMailbox';
import { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import { getOnePhonePeerOfTree } from '../daemon/getOnePhonePeerOfTree';
import type { PhoneContext } from '../PhoneContext';

/**
 * .what = takes a text sent from another grove into the inbox of the seat it names, in this tree
 * .why = a text crosses groves as a write through the grove connection into the receiver's
 *        inbox; this tree's daemon says it from there, as it says a text sent on this grove
 *
 * .note = the seat is the clone's slug, or its serial where it has none, as this tree's roster
 *         names it, so the copy lands in the mailbox the seat keeps across a revive. a name no
 *         clone here answers to is refused at once, so the sender's thread says why
 * .note = the write is a findsert by (uuid, way): a re-run of the same put writes naught twice
 */
export const setPhoneInboxText = async (
  input: { record: PhoneTextRecord; treeDir: string },
  context: Pick<PhoneContext, 'groveSelf' | 'sdkClone'>,
): Promise<{ outcome: 'QUEUED' | 'REFUSED'; reason: string | null }> => {
  const to = asPhoneAddressFromInput({
    raw: input.record.to,
    self: { grove: context.groveSelf, tree: basename(input.treeDir) },
  });
  const seat = await getOnePhonePeerOfTree(
    { peerTreeDir: input.treeDir, clone: to.clone },
    context,
  );
  if (!seat)
    return {
      outcome: 'REFUSED',
      reason: `no clone answers to @:${to.clone} in ${to.tree}`,
    };
  await daoPhoneMailbox.gen({
    treeDir: input.treeDir,
    clone: seat.slug ?? seat.serial,
    record: new PhoneTextRecord({
      ...input.record,
      way: 'in',
      status: 'QUEUED',
      reason: null,
    }),
  });
  return { outcome: 'QUEUED', reason: null };
};

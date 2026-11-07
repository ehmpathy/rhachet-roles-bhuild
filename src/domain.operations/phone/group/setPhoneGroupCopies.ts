import { MalfunctionError } from 'helpful-errors';

import { daoPhoneGroup } from '@src/access/daos/daoPhoneGroup';
import type { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';
import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import type { PhoneContext } from '../PhoneContext';

/**
 * .what = writes a group's record into the mailbox of every member, the sender included
 * .why = each member reads its groups from its own seat alone, so any member can text the group
 *        by name, and a reply to a group text reaches the whole group
 *
 * .note = the record is written before any text of the group: a member on a grove the
 *         connection can not reach fails the send loud, before a single text is written
 * .note = each write is a findsert by the group's uuid, so a re-run writes naught twice
 */
export const setPhoneGroupCopies = async (
  input: { group: PhoneGroup; peers: PhonePeer[]; self: PhoneSelf },
  context: Pick<PhoneContext, 'sdkGrove'>,
): Promise<void> => {
  // the sender's own copy
  await daoPhoneGroup.gen({
    treeDir: input.self.treeDir,
    clone: input.self.address.clone,
    group: input.group,
  });

  // each member's copy: on disk on this grove, through the grove connection beyond it
  for (const peer of input.peers) {
    if (peer.treeDir !== null) {
      await daoPhoneGroup.gen({
        treeDir: peer.treeDir,
        clone: peer.address.clone,
        group: input.group,
      });
      continue;
    }
    const answer = await context.sdkGrove.call({
      grove: peer.address.grove,
      tree: peer.address.tree,
      verb: 'put',
      payload: {
        kind: 'group',
        grove: peer.address.grove,
        clone: peer.address.clone,
        group: input.group,
      },
    });
    if (answer.outcome !== 'SET')
      throw new MalfunctionError('a group record did not land on its grove', {
        grove: peer.address.grove,
        tree: peer.address.tree,
        answer,
      });
  }
};

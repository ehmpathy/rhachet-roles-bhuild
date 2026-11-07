import { daoPhoneContacts } from '@src/access/daos/daoPhoneContacts';
import { daoPhoneGroup } from '@src/access/daos/daoPhoneGroup';
import { daoPhoneMailbox } from '@src/access/daos/daoPhoneMailbox';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import type { PhoneTreeClone } from '@src/domain.objects/phone/PhoneTreeClone';

import { asPhoneAddressString } from '../address/asPhoneAddressString';
import type { PhoneContext } from '../PhoneContext';
import { asPhoneInboundSenders } from './asPhoneInboundSenders';

/**
 * .what = every peer this clone may text, by the three grounds of admission
 * .why = admission and `phone.contacts get` read the same three lists; a refusal prints them so
 *        the sender sees who it may reach at once
 */
export interface PhoneReach {
  /**
   * the clone's contacts, canonical address strings
   */
  contacts: string[];

  /**
   * senders of an `in` text in the clone's mailbox, not already a contact
   */
  inbound: string[];

  /**
   * the other members of every group this clone is in, not already a contact or an inbound sender
   */
  groupMates: string[];

  /**
   * the other clones in the clone's own tree
   */
  ownTree: PhoneTreeClone[];

  /**
   * the clone's contacts file, when it holds a shape no reader here can parse; read as no grants
   */
  contactsUnreadable: { path: string; reason: string } | null;
}

/**
 * .what = reads the three lists of peers this clone may reach
 */
export const getOnePhoneReach = async (
  input: { self: PhoneSelf },
  context: Pick<PhoneContext, 'sdkClone'>,
): Promise<PhoneReach> => {
  // a file this clone can not read grants no admission, and never blocks a send: the contacts
  // file reads as no grants and is named back; an unreadable record is skipped
  const seat = {
    treeDir: input.self.treeDir,
    clone: input.self.address.clone,
  };
  const [
    { addresses: contacts, unreadable: contactsUnreadable },
    { entries },
    groups,
    roster,
  ] = await Promise.all([
    daoPhoneContacts.getAll(seat),
    daoPhoneMailbox.getAllReadable(seat),
    daoPhoneGroup.getAll(seat),
    context.sdkClone.getAllClones({ treeDir: input.self.treeDir }),
  ]);
  const inbound = asPhoneInboundSenders({ entries, contacts });
  const selfString = asPhoneAddressString(input.self.address);
  const groupMates = [
    ...new Set(groups.flatMap((group) => group.members)),
  ].filter(
    (member) =>
      member !== selfString &&
      !contacts.includes(member) &&
      !inbound.includes(member),
  );
  const ownTree = roster.filter((clone) => clone.serial !== input.self.serial);
  return { contacts, inbound, groupMates, ownTree, contactsUnreadable };
};

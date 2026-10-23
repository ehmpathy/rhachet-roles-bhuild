import { daoPhoneContacts } from '@src/access/daos/daoPhoneContacts';
import { daoPhoneMailbox } from '@src/access/daos/daoPhoneMailbox';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import type { PhoneTreeClone } from '@src/domain.objects/phone/PhoneTreeClone';

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
  const [
    { addresses: contacts, unreadable: contactsUnreadable },
    { entries },
    roster,
  ] = await Promise.all([
    daoPhoneContacts.getAll({
      treeDir: input.self.treeDir,
      clone: input.self.address.clone,
    }),
    daoPhoneMailbox.getAllReadable({
      treeDir: input.self.treeDir,
      clone: input.self.address.clone,
    }),
    context.sdkClone.getAllClones({ treeDir: input.self.treeDir }),
  ]);
  const inbound = asPhoneInboundSenders({ entries, contacts });
  const ownTree = roster.filter((clone) => clone.serial !== input.self.serial);
  return { contacts, inbound, ownTree, contactsUnreadable };
};

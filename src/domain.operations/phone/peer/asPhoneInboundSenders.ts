import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';

/**
 * .what = each peer that sent this clone a text, once, and not already a contact
 * .why = a clone may reply to any peer that texted it first; a contact already shows in its own
 *        list, so it is left out here
 */
export const asPhoneInboundSenders = (input: {
  entries: PhoneMailboxEntry[];
  contacts: string[];
}): string[] => {
  const senders = input.entries
    .filter((entry) => entry.record.way === 'in')
    .map((entry) => entry.record.from);
  return [...new Set(senders)].filter((from) => !input.contacts.includes(from));
};

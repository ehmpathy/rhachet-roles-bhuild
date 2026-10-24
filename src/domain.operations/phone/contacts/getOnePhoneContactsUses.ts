import {
  daoPhoneContactsUses,
  type PhoneContactsUsesState,
} from '@src/access/daos/daoPhoneContactsUses';

import { genPhoneMalfunction } from '../render/genPhoneMalfunction';

/**
 * .what = the meter on whether this tree's clones may manage their own contacts
 * .why = an unreadable meter fails loud and names the cure; it never reads as a state, so a
 *        meter no reader can parse can never lift the gate
 * .note = unset reads as blocked wherever it is enforced (isPhoneContactsMutable)
 */
export const getOnePhoneContactsUses = async (input: {
  treeDir: string;
}): Promise<PhoneContactsUsesState> => {
  const state = await daoPhoneContactsUses.getOneAsFound(input);
  if (state === 'unreadable')
    throw genPhoneMalfunction({
      vibe: 'bummer, the dam gauge is unreadable',
      headline: 'phone.contacts.uses meter has an unknown shape',
      nodes: [
        { text: `file: ${daoPhoneContactsUses.getOnePath(input)}` },
        {
          text: 'a human rewrites it: rhx phone.contacts.uses block (or allow)',
        },
      ],
    });
  return state;
};

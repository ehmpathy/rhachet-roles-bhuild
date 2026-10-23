import {
  daoPhoneContactsUses,
  type PhoneContactsUsesState,
} from '@src/access/daos/daoPhoneContactsUses';

/**
 * .what = the meter on whether this tree's clones may manage their own contacts
 * .note = unset reads as blocked wherever it is enforced (isPhoneContactsMutable)
 */
export const getOnePhoneContactsUses = (input: {
  treeDir: string;
}): Promise<PhoneContactsUsesState> => daoPhoneContactsUses.getOne(input);

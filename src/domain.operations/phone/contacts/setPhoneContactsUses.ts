import {
  daoPhoneContactsUses,
  type PhoneContactsUsesState,
} from '@src/access/daos/daoPhoneContactsUses';

/**
 * .what = lifts or drops the meter on this tree's clones; idempotent
 * .why = the meter is the booter's call on who may widen a clone's reach; the caller must hold
 *        that a human runs it, since the meter itself can not tell
 */
export const setPhoneContactsUses = async (input: {
  treeDir: string;
  state: 'allowed' | 'blocked';
}): Promise<{
  before: PhoneContactsUsesState;
  after: PhoneContactsUsesState;
}> => {
  const before = await daoPhoneContactsUses.getOne({ treeDir: input.treeDir });
  const after = await daoPhoneContactsUses.set(input);
  return { before, after };
};

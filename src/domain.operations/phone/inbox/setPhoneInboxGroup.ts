import { daoPhoneGroup } from '@src/access/daos/daoPhoneGroup';
import type { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';

import { getOnePhonePeerOfTree } from '../daemon/getOnePhonePeerOfTree';
import type { PhoneContext } from '../PhoneContext';

/**
 * .what = takes a group record sent from another grove into the mailbox of the seat it names
 * .why = each member reads its groups from its own seat alone, so a member on this grove can
 *        text the group by name, and reply to the whole group
 * .note = a name no clone here answers to keeps the name as given, so a seat that enrolls under
 *         it later still finds its group
 */
export const setPhoneInboxGroup = async (
  input: { group: PhoneGroup; clone: string; treeDir: string },
  context: Pick<PhoneContext, 'sdkClone'>,
): Promise<{ outcome: 'SET' }> => {
  const seat = await getOnePhonePeerOfTree(
    { peerTreeDir: input.treeDir, clone: input.clone },
    context,
  );
  await daoPhoneGroup.gen({
    treeDir: input.treeDir,
    clone: seat ? (seat.slug ?? seat.serial) : input.clone,
    group: input.group,
  });
  return { outcome: 'SET' };
};

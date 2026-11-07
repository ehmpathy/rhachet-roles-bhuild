import type { PhoneTreeClone } from '@src/domain.objects/phone/PhoneTreeClone';

import type { PhoneContext } from '../PhoneContext';
import { isPhoneCloneNamed } from '../peer/isPhoneCloneNamed';

/**
 * .what = the peer clone a text is addressed to, as its tree's roster shows it; null when no
 *         clone there answers to the name
 * .why = read before the say, so the daemon knows the peer's serial (it keys the `in` copy) and
 *        its reach state (a DEAD or DEAF peer waits with no say spent) while no say has fired
 */
export const getOnePhonePeerOfTree = async (
  input: { peerTreeDir: string; clone: string },
  context: Pick<PhoneContext, 'sdkClone'>,
): Promise<PhoneTreeClone | null> => {
  const clones = await context.sdkClone.getAllClones({
    treeDir: input.peerTreeDir,
  });
  return (
    clones.find((clone) => isPhoneCloneNamed({ clone, name: input.clone })) ??
    null
  );
};

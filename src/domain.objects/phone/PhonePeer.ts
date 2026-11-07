import { DomainLiteral } from 'domain-objects';

import { PhoneAddress } from './PhoneAddress';
import type { PhoneReachState } from './PhoneTreeClone';

/**
 * .what = an address, once looked up: its canonical form and where (if anywhere) it answers
 * .why = admission compares peers by clone serial, not by the name typed, so a clone that gains a
 *        slug later is still the same contact (F10, F12)
 */
interface PhonePeer {
  /**
   * the canonical address: `local` cast, a short serial expanded to the slug or full serial
   */
  address: PhoneAddress;

  /**
   * the peer tree's dir on this grove; null for a peer on another grove
   */
  treeDir: string | null;

  /**
   * the peer clone's full serial; null when no clone in that tree answers to the name yet
   */
  serial: string | null;

  /**
   * the peer clone's reach state as rhachet reports it (LIVE, DEAD, DEAF); null when unknown
   */
  reachState: PhoneReachState | null;
}

class PhonePeer extends DomainLiteral<PhonePeer> implements PhonePeer {
  public static nested = { address: PhoneAddress };
}

export { PhonePeer };

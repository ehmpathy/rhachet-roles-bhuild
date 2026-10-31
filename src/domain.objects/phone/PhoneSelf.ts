import { DomainLiteral } from 'domain-objects';

import { PhoneAddress } from './PhoneAddress';

/**
 * .what = the clone a phone verb runs as: where it lives, its serial, and its address
 * .why = texts and contacts are per seat (F12, F24): every verb reads and writes in the mailbox of
 *        the seat the clone sits in — `address.clone`, its slug, or its serial where it has none —
 *        so a seat's mail and grants outlive a revive, and the next clone in the seat inherits them
 */
interface PhoneSelf {
  /**
   * the clone's full serial; tells this clone apart from the others in its tree's roster
   */
  serial: string;

  /**
   * the dir of the tree the clone works in
   */
  treeDir: string;

  /**
   * the clone's own address, `local` already cast
   */
  address: PhoneAddress;
}

class PhoneSelf extends DomainLiteral<PhoneSelf> implements PhoneSelf {
  public static nested = { address: PhoneAddress };
}

export { PhoneSelf };

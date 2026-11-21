import { DomainLiteral } from 'domain-objects';

/**
 * .what = where a clone works, as the three grains that address it
 * .why = one peer must have one written form, so contacts compare by string;
 *        see `define.grains.grove-tree-clone`
 *
 * .note = the canonical string is `phone://grove=<grove>/tree=<tree>/clone=<clone>`
 */
interface PhoneAddress {
  /**
   * where the tree runs; a name `rhx git.grove.list` knows; never `local` once stored
   */
  grove: string;

  /**
   * the worktree, by its dir name; unique on its grove
   */
  tree: string;

  /**
   * the clone's slug, or its full serial when it has no slug
   */
  clone: string;
}

class PhoneAddress
  extends DomainLiteral<PhoneAddress>
  implements PhoneAddress {}

export { PhoneAddress };

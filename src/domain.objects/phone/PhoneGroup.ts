import { DomainEntity } from 'domain-objects';

/**
 * .what = a group of clones that text as one: its name, and every member, its founder included
 * .why = a group text is one text with a copy in every member's inbox, and a reply to it reaches
 *        the whole group; the record names who the group is, so any member can text it by name
 *
 * .note = a copy of the record sits in the mailbox of every member, so each member reads its
 *         groups from its own seat alone, on its own grove
 */
interface PhoneGroup {
  /**
   * the group's one name, minted when its first text was sent; `group:<first 8>` names it
   */
  uuid: string;

  /**
   * every member, canonical address strings, the founder first
   */
  members: string[];
}

class PhoneGroup extends DomainEntity<PhoneGroup> implements PhoneGroup {
  public static unique = ['uuid'] as const;
}

export { PhoneGroup };

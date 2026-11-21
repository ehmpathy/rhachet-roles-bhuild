import type { PhoneContactsUsesState } from '@src/access/daos/daoPhoneContactsUses';

/**
 * .what = whether this caller may grant or revoke a contact
 * .why = who a clone may reach is the booter's call, not the clone's; a human may always grant,
 *        and a clone may only where a human lifted the meter. unset reads as blocked
 */
export const isPhoneContactsMutable = (input: {
  isHuman: boolean;
  meter: PhoneContactsUsesState;
}): boolean => input.isHuman || input.meter === 'allowed';

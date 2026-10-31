import type { PhoneContactsUsesState } from '@src/access/daos/daoPhoneContactsUses';

import { genPhoneRefusal, type PhoneRefusal } from './genPhoneRefusal';

/**
 * .what = the refusal a clone meets when it grants or revokes a contact while its tree meter holds
 * .why = the refusal names the meter's state and the one human command that lifts it
 */
export const genPhoneContactsMeterRefusal = (input: {
  meter: PhoneContactsUsesState;
}): PhoneRefusal =>
  genPhoneRefusal({
    vibe: 'the dam holds',
    headline: 'this clone may not manage its own contacts',
    nodes: [
      {
        text: `meter: phone.contacts.uses = blocked${input.meter === 'unset' ? ' (default)' : ''}`,
      },
      {
        text: 'lift it (human), from any shell in this tree: rhx phone.contacts.uses allow',
      },
      { text: 'then run this grant again' },
    ],
  });

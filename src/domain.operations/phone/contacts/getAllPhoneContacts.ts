import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import type { PhoneContext } from '../PhoneContext';
import { getOnePhoneReach, type PhoneReach } from '../peer/getOnePhoneReach';
import { getAllPhoneContactReachStates } from './getAllPhoneContactReachStates';

/**
 * .what = who this clone may reach, each with its reach state where it can be read
 * .why = a seat left out of a boot grant is mute; `get` shows the gap at once, and shows
 *        whether each peer is LIVE before a text is sent
 */
export const getAllPhoneContacts = async (
  input: { self: PhoneSelf },
  context: PhoneContext,
): Promise<{
  reach: PhoneReach;
  reachStateOf: Record<string, string>;
}> => {
  const reach = await getOnePhoneReach({ self: input.self }, context);
  const reachStateOf = await getAllPhoneContactReachStates(
    { contacts: [...reach.contacts, ...reach.inbound], self: input.self },
    context,
  );
  return { reach, reachStateOf };
};

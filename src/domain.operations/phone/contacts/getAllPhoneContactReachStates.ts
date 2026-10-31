import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import type { PhoneContext } from '../PhoneContext';
import { getAllPhonePeers } from '../peer/getAllPhonePeers';
import { isPhoneRefusal } from '../render/isPhoneRefusal';
import { asPhoneContactReachState } from './asPhoneContactReachState';

/**
 * .what = the reach state of each contact, keyed by the contact's address
 * .why = each is read apart, so a peer whose tree is gone reads `gone` rather than fail the list
 */
export const getAllPhoneContactReachStates = async (
  input: { contacts: string[]; self: PhoneSelf },
  context: PhoneContext,
): Promise<Record<string, string>> => {
  const states = await Promise.all(
    input.contacts.map((contact) =>
      getOnePhoneContactReachState({ contact, self: input.self }, context),
    ),
  );
  return Object.fromEntries(
    input.contacts.map((contact, index) => [contact, states[index]!]),
  );
};

/**
 * .what = the reach state of one contact, or `gone` when its tree or grove no longer answers
 */
const getOnePhoneContactReachState = async (
  input: { contact: string; self: PhoneSelf },
  context: PhoneContext,
): Promise<string> => {
  const address = asPhoneAddressFromInput({
    raw: input.contact,
    self: { grove: context.groveSelf, tree: input.self.address.tree },
  });
  const peers = await getAllPhonePeers(
    { addresses: [address], self: input.self },
    context,
  ).catch((error: unknown) => {
    // a refusal here means the peer's tree or grove is gone; any other error is real
    if (isPhoneRefusal(error)) return null;
    throw error;
  });
  if (!peers?.[0]) return 'gone';
  return asPhoneContactReachState({ peer: peers[0] });
};

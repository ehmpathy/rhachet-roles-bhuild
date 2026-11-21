import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';

import { asPhonePeerForms } from '../peer/asPhonePeerForms';

/**
 * .what = every form a found peer may be stored under: its slug form, its full serial form when
 *         known, and the form the human typed
 */
export const asPhoneContactFormsOfPeer = (input: {
  peer: PhonePeer;
  typed: string;
}): string[] => [...asPhonePeerForms({ peer: input.peer }), input.typed];

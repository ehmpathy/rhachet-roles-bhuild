import type { PhonePeer } from '@src/domain.objects/phone/PhonePeer';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import { asPhoneAddressString } from '../address/asPhoneAddressString';

/**
 * .what = whether a peer is the clone that sends, by serial or by its canonical address
 */
export const isPhonePeerSelf = (input: {
  peer: PhonePeer;
  self: PhoneSelf;
}): boolean =>
  input.peer.serial === input.self.serial ||
  asPhoneAddressString(input.peer.address) ===
    asPhoneAddressString(input.self.address);

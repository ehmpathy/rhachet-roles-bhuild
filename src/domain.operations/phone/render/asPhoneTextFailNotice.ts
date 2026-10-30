import type { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneTextAlias } from '../text/asPhoneTextAlias';
import { asPhoneTreeLines } from './asPhoneTreeLines';

/**
 * .what = the notice the daemon says into a sender's own session when its text settles REFUSED
 *         or FAULTED
 * .why = an async failure must be loud, not merely on record; the sender learns at once, with
 *        the reason and the next move
 */
export const asPhoneTextFailNotice = (input: {
  record: PhoneTextRecord;
}): string => {
  const { record } = input;
  const next =
    record.status === 'REFUSED'
      ? 'rhx phone.contacts get, then text a peer that answers'
      : 'rhx phone.text get, then decide: resend, or let it rest (a resend may say it twice)';
  return [
    `🦫🔔 text ${asPhoneTextAlias({ uuid: record.uuid })} was ${record.status}`,
    ...asPhoneTreeLines({
      nodes: [
        { text: `into: ${record.to}` },
        { text: `reason: ${record.reason ?? 'none given'}` },
        { text: `next: ${next}` },
      ],
    }),
  ].join('\n');
};

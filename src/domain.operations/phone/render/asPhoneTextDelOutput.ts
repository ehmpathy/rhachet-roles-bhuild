import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';
import type { PhoneTextStatus } from '@src/domain.objects/phone/PhoneTextStatus';

import { asPhoneTextAlias } from '../text/asPhoneTextAlias';
import { asPhoneOutput } from './asPhoneOutput';

/**
 * .what = the output of `phone.text del`: the text withdrawn, or already withdrawn
 */
export const asPhoneTextDelOutput = (input: {
  entry: PhoneMailboxEntry;
  statusBefore: PhoneTextStatus;
}): string => {
  const record = input.entry.record;
  const isNoop = input.statusBefore === 'WITHDRAWN';
  return asPhoneOutput({
    vibe: isNoop ? 'already fished out' : 'fished it back out',
    root: 'phone.text del',
    nodes: [
      {
        text: `text: ${asPhoneTextAlias({ uuid: record.uuid })} → ${record.to}`,
      },
      {
        text: isNoop
          ? 'status: WITHDRAWN (no change)'
          : 'status: QUEUED → WITHDRAWN (never said)',
      },
    ],
  });
};

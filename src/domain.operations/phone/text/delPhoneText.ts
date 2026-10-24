import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import type { PhoneTextStatus } from '@src/domain.objects/phone/PhoneTextStatus';

import { asPhoneTextSettledNodes } from '../render/asPhoneTextSettledNodes';
import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { asPhoneTextAlias } from './asPhoneTextAlias';
import { getOnePhoneTextByRef } from './getOnePhoneTextByRef';
import { setPhoneTextFaultedIfSayStale } from './setPhoneTextFaultedIfSayStale';

/**
 * .what = withdraws a QUEUED text this clone sent, so the daemon never says it
 * .why = a sender may take back a text no peer has read; a text already said can not be unsaid,
 *        so a withdraw of a settled text fails loud rather than pretend
 *
 * .note = a second withdraw of a WITHDRAWN text is a no-op (idempotent)
 */
export const delPhoneText = async (input: {
  text: string;
  self: PhoneSelf;
}): Promise<{ entry: PhoneMailboxEntry; statusBefore: PhoneTextStatus }> => {
  const found = await getOnePhoneTextByRef({
    raw: input.text,
    self: input.self,
  });
  const alias = asPhoneTextAlias({ uuid: found.record.uuid });

  // hold the text's claim, so the daemon can not say it between this read and the withdraw
  const { isClaimed, actStale } = await daoPhoneMailbox.genClaim({
    path: found.path,
    act: 'withdraw',
  });
  if (!isClaimed) {
    const actHeld = await daoPhoneMailbox.getClaimActOfHolder({
      path: found.path,
    });
    throw genPhoneRefusal({
      vibe: 'hold up, the daemon has that one in its paws',
      headline:
        actHeld === 'say'
          ? `text ${alias} is mid-say right now`
          : `text ${alias} is mid-write right now`,
      nodes: [
        {
          text:
            actHeld === 'say'
              ? 'a text the daemon is mid-say on can not be withdrawn'
              : 'the daemon writes its status for a moment; no say has fired',
        },
        {
          text:
            actHeld === 'say'
              ? 'read its fate in a moment'
              : 'withdraw it again in a moment',
          children: [
            {
              text:
                actHeld === 'say'
                  ? `rhx phone.text get --text ${alias}`
                  : `rhx phone.text del --text ${alias}`,
            },
          ],
        },
      ],
    });
  }
  try {
    // a dead daemon's say may have landed; then it is settled, never withdrawn as unsaid
    await setPhoneTextFaultedIfSayStale({ path: found.path, actStale });
    return await delPhoneTextClaimed({ path: found.path, alias });
  } finally {
    await daoPhoneMailbox.delClaim({ path: found.path });
  }
};

/**
 * .what = withdraws one claimed text, read fresh under the claim
 */
const delPhoneTextClaimed = async (input: {
  path: string;
  alias: string;
}): Promise<{ entry: PhoneMailboxEntry; statusBefore: PhoneTextStatus }> => {
  const entry = await daoPhoneMailbox.getOne({ path: input.path });
  const { alias } = input;
  const statusBefore = entry.record.status;

  // only the sender may withdraw a text
  if (entry.record.way === 'in')
    throw genPhoneRefusal({
      vibe: "that one's not yours to take back",
      headline: `text ${alias} came in from ${entry.record.from}`,
      nodes: [{ text: 'only its sender may withdraw a text' }],
    });

  // a withdrawn text stays withdrawn
  if (statusBefore === 'WITHDRAWN') return { entry, statusBefore };

  // a settled text can not be unsaid
  if (statusBefore !== 'QUEUED')
    throw genPhoneRefusal({
      vibe: "that one's downstream",
      headline: `text ${alias} was already ${statusBefore}`,
      nodes: asPhoneTextSettledNodes({
        status: statusBefore,
        to: entry.record.to,
        alias,
      }),
    });

  // withdraw it
  const withdrawn = await daoPhoneMailbox.set({
    entry,
    status: 'WITHDRAWN',
    reason: 'withdrawn by its sender; never said',
  });
  return { entry: withdrawn, statusBefore };
};

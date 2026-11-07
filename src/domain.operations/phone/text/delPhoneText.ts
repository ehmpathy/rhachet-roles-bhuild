import { z } from 'zod';

import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';
import {
  PHONE_TEXT_STATUSES,
  type PhoneTextStatus,
} from '@src/domain.objects/phone/PhoneTextStatus';

import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import type { PhoneContext } from '../PhoneContext';
import { asPhoneTextSettledNodes } from '../render/asPhoneTextSettledNodes';
import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { getOnePhoneTreeDir } from '../tree/getOnePhoneTreeDir';
import { asPhoneTextAlias } from './asPhoneTextAlias';
import { delPhoneTextInCopy } from './delPhoneTextInCopy';
import { getOnePhoneTextByRef } from './getOnePhoneTextByRef';

const schemaOfDelAnswer = z.object({
  outcome: z.enum(['WITHDRAWN', 'SETTLED', 'HELD', 'ABSENT']),
  statusBefore: z.enum(PHONE_TEXT_STATUSES).nullable(),
  act: z.enum(['prep', 'say', 'withdraw']).nullable(),
});

/**
 * .what = withdraws a QUEUED text this clone sent, so the receiver tree's daemon never says it
 * .why = a sender may take back a text no peer has read; a text already said can not be unsaid,
 *        so a withdraw of a settled text fails loud rather than pretend
 *
 * .note = the withdraw lands on the receiver's `in` copy, under the same claim the daemon takes
 *         to say it, then mirrors onto the sender's `out` copy; so a withdraw and a say can not
 *         both win. a peer on another grove is reached through the grove connection
 * .note = a second withdraw of a WITHDRAWN text is a no-op (idempotent)
 */
export const delPhoneText = async (
  input: { text: string; self: PhoneSelf },
  context: PhoneContext & { log: (line: string) => void },
): Promise<{ entry: PhoneMailboxEntry; statusBefore: PhoneTextStatus }> => {
  const found = await getOnePhoneTextByRef({
    raw: input.text,
    self: input.self,
  });
  const alias = asPhoneTextAlias({ uuid: found.record.uuid });

  // only the sender may withdraw a text
  if (found.record.way === 'in')
    throw genPhoneRefusal({
      vibe: "that one's not yours to take back",
      headline: `text ${alias} came in from ${found.record.from}`,
      nodes: [{ text: 'only its sender may withdraw a text' }],
    });

  // a withdrawn text stays withdrawn; a settled one can not be unsaid
  if (found.record.status === 'WITHDRAWN')
    return { entry: found, statusBefore: 'WITHDRAWN' };
  if (found.record.status !== 'QUEUED')
    throw genPhoneRefusalOfSettled({
      alias,
      status: found.record.status,
      to: found.record.to,
    });

  // withdraw the `in` copy where it waits, then mirror the outcome onto the `out` copy
  const answer = await delPhoneTextAtPeer(
    { entry: found, self: input.self },
    context,
  );
  if (answer.outcome === 'HELD')
    throw genPhoneRefusalOfHeld({ alias, act: answer.act });
  const statusSettled =
    answer.outcome === 'SETTLED' ? asPhoneTextStatusSettled(answer) : null;
  if (statusSettled) {
    // the `out` copy reads what the `in` copy settled as, even if a mirror was lost; a mirror
    // that landed already carries the reason, so the copy is read fresh and its reason kept
    const fresh = await daoPhoneMailbox.getOne({ path: found.path });
    if (fresh.record.status !== statusSettled)
      await daoPhoneMailbox.set({
        entry: fresh,
        status: statusSettled,
        reason: fresh.record.reason,
      });
    throw genPhoneRefusalOfSettled({
      alias,
      status: statusSettled,
      to: found.record.to,
    });
  }
  const withdrawn = await daoPhoneMailbox.set({
    entry: found,
    status: 'WITHDRAWN',
    reason: 'withdrawn by its sender; never said',
  });
  return { entry: withdrawn, statusBefore: 'QUEUED' };
};

/**
 * .what = withdraws the `in` copy of one text at its receiver, on disk or across a grove
 * .note = an `in` copy that is absent (its write was lost) leaves naught to say, so the `out`
 *         copy is withdrawn alone
 */
const delPhoneTextAtPeer = async (
  input: { entry: PhoneMailboxEntry; self: PhoneSelf },
  context: PhoneContext & { log: (line: string) => void },
): Promise<z.infer<typeof schemaOfDelAnswer>> => {
  const to = asPhoneAddressFromInput({
    raw: input.entry.record.to,
    self: { grove: context.groveSelf, tree: input.self.address.tree },
  });

  // a peer on another grove: through the grove connection
  if (to.grove !== context.groveSelf) {
    const raw = await context.sdkGrove.call({
      grove: to.grove,
      tree: to.tree,
      verb: 'del',
      payload: {
        grove: to.grove,
        clone: to.clone,
        uuid: input.entry.record.uuid,
      },
    });
    return schemaOfDelAnswer.parse(raw);
  }

  // a peer on this grove: on disk
  const peerTreeDir = await getOnePhoneTreeDir(
    {
      tree: to.tree,
      treeDirSelf: input.self.treeDir,
      treeSelf: input.self.address.tree,
    },
    context,
  );
  if (!peerTreeDir) return { outcome: 'ABSENT', statusBefore: null, act: null };
  return delPhoneTextInCopy(
    { treeDir: peerTreeDir, clone: to.clone, uuid: input.entry.record.uuid },
    context,
  );
};

/**
 * .what = the refusal of a withdraw while the daemon holds the text's claim
 */
const genPhoneRefusalOfHeld = (input: {
  alias: string;
  act: 'prep' | 'say' | 'withdraw' | null;
}) =>
  genPhoneRefusal({
    vibe: 'hold up, the daemon has that one in its paws',
    headline:
      input.act === 'say'
        ? `text ${input.alias} is mid-say right now`
        : `text ${input.alias} is mid-write right now`,
    nodes: [
      {
        text:
          input.act === 'say'
            ? 'a text the daemon is mid-say on can not be withdrawn'
            : 'the daemon writes its status for a moment; no say has fired',
      },
      {
        text:
          input.act === 'say'
            ? 'read its fate in a moment'
            : 'withdraw it again in a moment',
        children: [
          {
            text:
              input.act === 'say'
                ? `rhx phone.text get --text ${input.alias}`
                : `rhx phone.text del --text ${input.alias}`,
          },
        ],
      },
    ],
  });

/**
 * .what = the settled status an `in` copy answered with, or null for one that is not settled
 */
const asPhoneTextStatusSettled = (input: {
  statusBefore: PhoneTextStatus | null;
}): PhoneTextStatusSettled | null =>
  input.statusBefore === 'DELIVERED' ||
  input.statusBefore === 'REFUSED' ||
  input.statusBefore === 'FAULTED'
    ? input.statusBefore
    : null;

type PhoneTextStatusSettled = Exclude<PhoneTextStatus, 'QUEUED' | 'WITHDRAWN'>;

/**
 * .what = the refusal of a withdraw of a text already settled
 */
const genPhoneRefusalOfSettled = (input: {
  alias: string;
  status: PhoneTextStatusSettled;
  to: string;
}) =>
  genPhoneRefusal({
    vibe: "that one's downstream",
    headline: `text ${input.alias} was already ${input.status}`,
    nodes: asPhoneTextSettledNodes({
      status: input.status,
      to: input.to,
      alias: input.alias,
    }),
  });

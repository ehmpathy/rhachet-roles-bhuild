import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';
import type { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';

import { asPhoneTextAlias } from '../text/asPhoneTextAlias';
import { asPhoneOutput } from './asPhoneOutput';
import type { PhoneTreeNode } from './asPhoneTreeLines';

/**
 * .what = the output of `phone.text set`: who sent, to whom, the text's name, and its status
 * .note = the status line names the receiver daemon as observed: one already live, one this send
 *         woke, or none seen to swim. in the last case the text is still QUEUED in the inbox, and
 *         the line says so and names the cure, rather than promise a say no daemon is there to make
 * .note = a send whose every peer is on another grove names NONE: each such grove wakes its own
 *         daemon. a text the grove refused or faulted on is named with its status at once
 * .note = a peer named twice is one peer; the drop is named, never silent
 */
export const asPhoneTextSetOutput = (input: {
  entries: PhoneMailboxEntry[];
  daemon: 'FOUND' | 'STARTED' | 'UNCONFIRMED' | 'NONE';
  duplicates: number;
  group: PhoneGroup | null;
}): string => {
  const pronoun = input.entries.length > 1 ? 'them' : 'it';

  // the send reads no seat's pane, so it promises a carry, never a say: a peer that is DEAD, at a
  // modal, or not in its tree is learned by the receiver's daemon, and the thread names why
  const nodeOfLand: PhoneTreeNode = {
    text: 'a text that cannot land yet is held, or refused, with the reason: rhx phone.text get',
  };
  const isAnyQueued = input.entries.some(
    (entry) => entry.record.status === 'QUEUED',
  );
  const statusNodeOfNoneQueued: PhoneTreeNode = {
    text: `status: naught QUEUED; the fate of each is named above`,
    children: [{ text: 'read it again: rhx phone.text get' }],
  };
  const statusNode: PhoneTreeNode = !isAnyQueued
    ? statusNodeOfNoneQueued
    : {
        FOUND: {
          text: `status: QUEUED → the receiver's daemon says ${pronoun}`,
          children: [nodeOfLand],
        },
        STARTED: {
          text: `status: QUEUED → the receiver's daemon woke (was down); it says ${pronoun}`,
          children: [nodeOfLand],
        },
        UNCONFIRMED: {
          text: "status: QUEUED, but no receiver's daemon was seen to swim",
          children: [
            {
              text: "the receiver's next stop tells it; or start one there: rhx phone.daemon set",
            },
          ],
        },
        NONE: {
          text: `status: QUEUED → into the inbox on its grove; that grove's daemon says ${pronoun}`,
          children: [nodeOfLand],
        },
      }[input.daemon];
  const duplicateNodes: PhoneTreeNode[] =
    input.duplicates > 0
      ? [
          {
            text: `${input.duplicates} repeated --into dropped; each peer gets one text`,
          },
        ]
      : [];
  const [first] = input.entries;
  if (!first)
    return asPhoneOutput({
      vibe: 'naught to send',
      root: 'phone.text set',
      nodes: [{ text: 'status: naught sent; no peer was named' }],
    });
  const record = first.record;
  const reTail = record.re
    ? `, re ${asPhoneTextAlias({ uuid: record.re })}`
    : '';

  // a text the grove refused or faulted on at the send reads its fate at once
  const asFateTail = (entry: PhoneMailboxEntry): string =>
    entry.record.status === 'QUEUED'
      ? ''
      : ` · ${entry.record.status} ${entry.record.reason ?? ''}`.trimEnd();

  // one peer: the text by its name
  if (input.entries.length === 1)
    return asPhoneOutput({
      vibe: 'tail slapped!',
      root: 'phone.text set',
      nodes: [
        { text: `from: ${record.from}` },
        { text: `into: ${record.to}${asFateTail(first)}` },
        { text: `text: ${asPhoneTextAlias({ uuid: record.uuid })}${reTail}` },
        ...duplicateNodes,
        statusNode,
      ],
    });

  // a group: its name, then one line per peer
  const groupName = input.group
    ? `group:${asPhoneTextAlias({ uuid: input.group.uuid })} · `
    : '';
  return asPhoneOutput({
    vibe: `tail slapped, x${input.entries.length}!`,
    root: 'phone.text set',
    nodes: [
      { text: `from: ${record.from}` },
      {
        text: `group: ${groupName}${input.entries.length} peers${reTail}`,
        children: input.entries.map((entry) => ({
          text: `${asPhoneTextAlias({ uuid: entry.record.uuid })} → ${entry.record.to}${asFateTail(entry)}`,
        })),
      },
      ...duplicateNodes,
      statusNode,
    ],
  });
};

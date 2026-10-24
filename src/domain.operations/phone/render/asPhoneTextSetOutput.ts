import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';

import { asPhoneTextAlias } from '../text/asPhoneTextAlias';
import { asPhoneOutput } from './asPhoneOutput';
import type { PhoneTreeNode } from './asPhoneTreeLines';

/**
 * .what = the output of `phone.text set`: who sent, to whom, the text's name, and its status
 * .note = the status line names the daemon as observed: one already live, one this send started,
 *         or none seen to swim. in the last case the text is still QUEUED on disk, and the line
 *         says so and names the cure, rather than promise a delivery no daemon is there to make
 * .note = a peer named twice is one peer; the drop is named, never silent
 */
export const asPhoneTextSetOutput = (input: {
  entries: PhoneMailboxEntry[];
  daemon: 'FOUND' | 'STARTED' | 'UNCONFIRMED';
  duplicates: number;
}): string => {
  const pronoun = input.entries.length > 1 ? 'them' : 'it';

  // the send reads no roster, so it promises a carry, never a delivery: a peer that is DEAD, at a
  // modal, or not in its tree is learned by the daemon, and the thread names why
  const nodeOfLand: PhoneTreeNode = {
    text: 'a text that cannot land yet is held, or refused, with the reason: rhx phone.text get',
  };
  const statusNode: PhoneTreeNode = {
    FOUND: {
      text: `status: QUEUED → the daemon carries ${pronoun}`,
      children: [nodeOfLand],
    },
    STARTED: {
      text: `status: QUEUED → a daemon started (was down); it carries ${pronoun}`,
      children: [nodeOfLand],
    },
    UNCONFIRMED: {
      text: 'status: QUEUED, but no daemon was seen to swim',
      children: [{ text: 'start one: rhx phone.daemon set' }],
    },
  }[input.daemon];
  const duplicateNodes: PhoneTreeNode[] =
    input.duplicates > 0
      ? [
          {
            text: `${input.duplicates} repeated --to dropped; each peer gets one text`,
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

  // one peer: the text by its name
  if (input.entries.length === 1)
    return asPhoneOutput({
      vibe: 'tail slapped!',
      root: 'phone.text set',
      nodes: [
        { text: `from: ${record.from}` },
        { text: `to: ${record.to}` },
        { text: `text: ${asPhoneTextAlias({ uuid: record.uuid })}${reTail}` },
        ...duplicateNodes,
        statusNode,
      ],
    });

  // a group: one line per peer
  return asPhoneOutput({
    vibe: `tail slapped, x${input.entries.length}!`,
    root: 'phone.text set',
    nodes: [
      { text: `from: ${record.from}` },
      {
        text: `group: ${input.entries.length} peers${reTail}`,
        children: input.entries.map((entry) => ({
          text: `${asPhoneTextAlias({ uuid: entry.record.uuid })} → ${entry.record.to}`,
        })),
      },
      ...duplicateNodes,
      statusNode,
    ],
  });
};

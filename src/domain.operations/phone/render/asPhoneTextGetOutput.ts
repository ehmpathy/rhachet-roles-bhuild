import { basename } from 'path';

import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';

import { isPhoneAddressInTreeOf } from '../address/isPhoneAddressInTreeOf';
import { asPhoneTextAlias } from '../text/asPhoneTextAlias';
import { asPhoneTextArrow } from '../text/asPhoneTextArrow';
import { isPhoneTextQueuedIn } from '../text/isPhoneTextQueuedIn';
import { asPhoneOutput } from './asPhoneOutput';
import type { PhoneTreeNode } from './asPhoneTreeLines';

/**
 * .what = the output of `phone.text get`: this clone's thread, one node per text, in write order
 * .why = the mailbox is the audit trail; each line names the text, the other party, the
 *        direction, the status and why it waits, and the words beneath
 * .note = a text held for this clone with no live daemon in its tree would wait in silence; the
 *         thread then ends with a line that says the daemon is down, and names the cure
 */
export const asPhoneTextGetOutput = (input: {
  entries: PhoneMailboxEntry[];
  unreadable: { path: string; reason: string }[];
  daemon: 'LIVE' | 'DOWN';
  self: string;
}): string => {
  // name whose thread this is, as `phone.contacts get` does
  const nodeSelf: PhoneTreeNode = { text: `you: ${input.self}` };

  // a record this clone can not read is named, never hidden from the trail
  const nodesUnreadable: PhoneTreeNode[] =
    input.unreadable.length > 0
      ? [
          {
            text: `${input.unreadable.length} unreadable, skipped`,
            children: [
              ...input.unreadable.map((bad) => ({
                text: `${basename(bad.path)}: ${bad.reason}`,
              })),
              {
                text: 'a torn write, or a newer rhachet-roles-bhuild; upgrade, else ask who wrote it',
              },
            ],
          },
        ]
      : [];

  if (input.entries.length === 0 && nodesUnreadable.length > 0)
    return asPhoneOutput({
      vibe: "here's the thread",
      root: 'phone.text get',
      nodes: [nodeSelf, ...nodesUnreadable],
    });
  if (input.entries.length === 0)
    return asPhoneOutput({
      vibe: 'the pond is still',
      root: 'phone.text get',
      nodes: [nodeSelf, { text: '(no texts yet)' }],
    });

  // align the status column across every line
  const heads = input.entries.map(
    (entry) =>
      `${asPhoneTextAlias({ uuid: entry.record.uuid })} ${asPhoneTextArrow({ record: entry.record })}`,
  );
  const width = Math.max(...heads.map((head) => head.length));
  const nodes: PhoneTreeNode[] = input.entries.map((entry, index) => {
    const record = entry.record;
    const tags = [
      record.status,
      ...(record.reason ? [record.reason] : []),
      ...(record.re ? [`re ${asPhoneTextAlias({ uuid: record.re })}`] : []),
    ].join(' · ');
    return {
      text: `${heads[index]!.padEnd(width)}   ${tags}`,
      children: record.what.split('\n').map((line) => ({ text: line })),
    };
  });
  // a QUEUED text this tree's daemon must say, with no daemon here: say so, and name the cure.
  // a text held for this clone waits on it; so does one this clone sent to a seat in its own tree
  const isQueuedInForSelf = input.entries.some((entry) =>
    isPhoneTextQueuedIn(entry),
  );
  const isQueuedOutInTree = input.entries.some(
    (entry) =>
      entry.record.way === 'out' &&
      entry.record.status === 'QUEUED' &&
      isPhoneAddressInTreeOf({ address: entry.record.to, of: input.self }),
  );
  const nodesDaemon: PhoneTreeNode[] =
    input.daemon === 'DOWN' && (isQueuedInForSelf || isQueuedOutInTree)
      ? [
          {
            text: isQueuedInForSelf
              ? 'daemon: DOWN — the texts held for you wait for it, or for your next stop'
              : 'daemon: DOWN — the QUEUED texts to this tree wait for it',
            children: [{ text: 'start it: rhx phone.daemon set' }],
          },
        ]
      : [];
  return asPhoneOutput({
    vibe: "here's the thread",
    root: 'phone.text get',
    nodes: [nodeSelf, ...nodes, ...nodesUnreadable, ...nodesDaemon],
  });
};

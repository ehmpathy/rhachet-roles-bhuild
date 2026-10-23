import { basename } from 'path';

import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';

import { asPhoneTextAlias } from '../text/asPhoneTextAlias';
import { asPhoneTextArrow } from '../text/asPhoneTextArrow';
import { isPhoneTextQueuedOut } from '../text/isPhoneTextQueuedOut';
import { asPhoneOutput } from './asPhoneOutput';
import type { PhoneTreeNode } from './asPhoneTreeLines';

/**
 * .what = the output of `phone.text get`: this clone's thread, one node per text, in write order
 * .why = the mailbox is the audit trail; each line names the text, the other party, the
 *        direction, the status and why it waits, and the words beneath
 * .note = a QUEUED text with no live daemon in the tree would wait in silence; the thread then
 *         ends with a line that says the daemon is down, and names the cure
 */
export const asPhoneTextGetOutput = (input: {
  entries: PhoneMailboxEntry[];
  unreadable: { path: string; reason: string }[];
  daemon: 'LIVE' | 'DOWN';
}): string => {
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
                text: 'a newer rhachet-roles-bhuild may have written it; upgrade to read it',
              },
            ],
          },
        ]
      : [];

  if (input.entries.length === 0 && nodesUnreadable.length > 0)
    return asPhoneOutput({
      vibe: "here's the thread",
      root: 'phone.text get',
      nodes: nodesUnreadable,
    });
  if (input.entries.length === 0)
    return asPhoneOutput({
      vibe: 'the pond is still',
      root: 'phone.text get',
      nodes: [{ text: '(no texts yet)' }],
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
  // a QUEUED text with no daemon to carry it: say so, and name the cure
  const isStalled =
    input.daemon === 'DOWN' &&
    input.entries.some((entry) => isPhoneTextQueuedOut(entry));
  const nodesDaemon: PhoneTreeNode[] = isStalled
    ? [
        {
          text: 'daemon: DOWN — the QUEUED texts wait for it',
          children: [{ text: 'start it: rhx phone.daemon set' }],
        },
      ]
    : [];
  return asPhoneOutput({
    vibe: "here's the thread",
    root: 'phone.text get',
    nodes: [...nodes, ...nodesUnreadable, ...nodesDaemon],
  });
};

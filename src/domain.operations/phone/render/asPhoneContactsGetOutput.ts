import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import { asPhoneAddressString } from '../address/asPhoneAddressString';
import type { PhoneReach } from '../peer/getOnePhoneReach';
import { asPhoneOutput } from './asPhoneOutput';
import type { PhoneTreeNode } from './asPhoneTreeLines';

/**
 * .what = the output of `phone.contacts get`: this clone, its contacts, the peers that texted it,
 *         and its own tree, each with its reach state
 */
export const asPhoneContactsGetOutput = (input: {
  self: PhoneSelf;
  reach: PhoneReach;
  reachStateOf: Record<string, string>;
}): string => {
  // align the state column within each group
  const asRows = (rows: { name: string; state: string }[]): PhoneTreeNode[] => {
    if (rows.length === 0) return [{ text: '(none)' }];
    const width = Math.max(...rows.map((row) => row.name.length));
    return rows.map((row) => ({
      text: `${row.name.padEnd(width)}   (${row.state})`,
    }));
  };
  // an empty contact list names how to get one, never a dead end
  const nodesContacts: PhoneTreeNode[] =
    input.reach.contacts.length > 0
      ? asRows(
          input.reach.contacts.map((name) => ({
            name,
            state: input.reachStateOf[name] ?? 'unknown',
          })),
        )
      : [
          {
            text: '(none)',
            children: [
              {
                text: 'grant one: rhx phone.contacts set --address phone://grove=local/tree=<tree>/clone=<clone>',
              },
              {
                text: 'a clone may grant its own only where the tree meter allows: rhx phone.contacts.uses get',
              },
            ],
          },
        ];

  // the own tree lists the clones that can take a text first; the DEAD fold into one count
  const ownTreeAwake = input.reach.ownTree
    .filter((clone) => clone.reachState !== 'DEAD')
    .sort(
      (a, b) =>
        Number(b.reachState === 'LIVE') - Number(a.reachState === 'LIVE'),
    );
  const ownTreeDead = input.reach.ownTree.length - ownTreeAwake.length;
  const nodesOwnTree: PhoneTreeNode[] = [
    ...(ownTreeAwake.length > 0 || ownTreeDead === 0
      ? asRows(
          ownTreeAwake.map((clone) => ({
            name: `@:${clone.slug ?? clone.serial.slice(0, 8)}`,
            state: clone.slug
              ? clone.reachState
              : `${clone.reachState} · no slug; stored as its full serial`,
          })),
        )
      : []),
    ...(ownTreeDead > 0
      ? [{ text: `+ ${ownTreeDead} DEAD, not shown (see all: rhx clone list)` }]
      : []),
  ];

  // a contacts file no reader can parse is named, with the command that rewrites it
  const nodesContactsUnreadable: PhoneTreeNode[] = input.reach
    .contactsUnreadable
    ? [
        {
          text: `unreadable, read as no grants: ${input.reach.contactsUnreadable.reason}`,
          children: [
            { text: input.reach.contactsUnreadable.path },
            {
              text: 'a grant rewrites it: rhx phone.contacts set --address <address>',
            },
          ],
        },
      ]
    : [];

  const nodes: PhoneTreeNode[] = [
    { text: `you: ${asPhoneAddressString(input.self.address)}` },
    {
      text: 'contacts',
      children: [...nodesContactsUnreadable, ...nodesContacts],
    },
    ...(input.reach.inbound.length
      ? [
          {
            text: 'texted you',
            children: asRows(
              input.reach.inbound.map((name) => ({
                name,
                state: input.reachStateOf[name] ?? 'unknown',
              })),
            ),
          },
        ]
      : []),
    { text: 'own tree', children: nodesOwnTree },
  ];
  return asPhoneOutput({
    vibe: "here's who's in the pond",
    root: 'phone.contacts',
    nodes,
  });
};

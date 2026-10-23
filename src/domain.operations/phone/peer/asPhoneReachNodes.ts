import type { PhoneTreeNode } from '../render/asPhoneTreeLines';
import type { PhoneReach } from './getOnePhoneReach';

/**
 * .what = the reachable peers as tree nodes, each tagged with its ground of admission
 * .why = a refusal for an unknown peer lists who the sender may reach, aligned, so the right
 *        address is a copy away
 */
export const asPhoneReachNodes = (input: {
  reach: PhoneReach;
}): PhoneTreeNode[] => {
  // a DEAD clone in this tree can never take a text, so it folds into a count
  const ownTreeAwake = input.reach.ownTree.filter(
    (clone) => clone.reachState !== 'DEAD',
  );
  const ownTreeDeadCount = input.reach.ownTree.length - ownTreeAwake.length;

  const rows = [
    ...input.reach.contacts.map((address) => ({
      name: address,
      tag: 'contact',
    })),
    ...input.reach.inbound.map((address) => ({
      name: address,
      tag: 'texted you',
    })),
    ...ownTreeAwake.map((clone) => ({
      name: `@:${clone.slug ?? clone.serial.slice(0, 8)}`,
      tag: 'own tree',
    })),
  ];
  const folded =
    ownTreeDeadCount > 0
      ? [{ text: `+ ${ownTreeDeadCount} DEAD in own tree, not shown` }]
      : [];
  if (rows.length === 0) return [{ text: '(no one yet)' }, ...folded];
  const width = Math.max(...rows.map((row) => row.name.length));
  return [
    ...rows.map((row) => ({
      text: `${row.name.padEnd(width)}   (${row.tag})`,
    })),
    ...folded,
  ];
};

import type { PhoneTextStatus } from '@src/domain.objects/phone/PhoneTextStatus';

import type { PhoneTreeNode } from './asPhoneTreeLines';

/**
 * .what = the facts and the next move for a withdraw of a text that has already settled
 * .why = each settled status needs its own advice: a DELIVERED text reached the peer, so a
 *        correction is the move; a REFUSED text never reached it, so the address is the fix and
 *        a fresh send the move; a FAULTED text may or may not have landed, so a check comes first
 */
export const asPhoneTextSettledNodes = (input: {
  status: Exclude<PhoneTextStatus, 'QUEUED' | 'WITHDRAWN'>;
  to: string;
  alias: string;
}): PhoneTreeNode[] => {
  const stepFresh = `rhx phone.text set --to <address> --what '...'`;
  const stepLinked = `rhx phone.text set --to ${input.to} --re ${input.alias} --what '...'`;
  if (input.status === 'REFUSED')
    return [
      { text: 'a refused text never reached the peer; naught to take back' },
      {
        text: 'fix the address, then send it fresh',
        children: [
          { text: 'see who you may reach: rhx phone.contacts get' },
          { text: stepFresh },
        ],
      },
    ];
  if (input.status === 'FAULTED')
    return [
      {
        text: 'a faulted say may or may not have landed; it can not be unsaid',
      },
      {
        text: 'ask the peer before a resend, linked to this text',
        children: [{ text: stepLinked }],
      },
    ];
  return [
    { text: 'a delivered text can not be unsaid' },
    { text: 'send a correction', children: [{ text: stepLinked }] },
  ];
};

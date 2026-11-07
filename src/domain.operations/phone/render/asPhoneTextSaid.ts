import type { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneTextAlias } from '../text/asPhoneTextAlias';

/**
 * .what = the message a peer receives in its session: who sent it, the words, and the exact
 *         reply command
 * .why = the text lands as the next message in the peer's session, signed, so the peer can
 *        answer with one copy and paste; the header names the uuid, the text's one name; the
 *        reply tree has its own root line, since a branch below a blank line has no trunk
 * .note = a group text names its group, and its reply answers the whole group by default; a
 *         reply to the sender alone is one --into away
 */
export const asPhoneTextSaid = (input: { record: PhoneTextRecord }): string => {
  const { record } = input;
  const alias = asPhoneTextAlias({ uuid: record.uuid });
  const reTail = record.re
    ? ` (re ${asPhoneTextAlias({ uuid: record.re })})`
    : '';
  const groupTail = record.group
    ? ` to group:${asPhoneTextAlias({ uuid: record.group })}`
    : '';
  const replies = record.group
    ? [
        `   ├─ the whole group: rhx phone.text set --re ${alias} --what '...'`,
        `   ├─ the sender alone: rhx phone.text set --into ${record.from} --re ${alias} --what '...'`,
      ]
    : [
        `   ├─ rhx phone.text set --into ${record.from} --re ${alias} --what '...'`,
      ];
  return [
    `🦫🔔 text ${alias} from ${record.from}${groupTail}${reTail}`,
    '',
    record.what,
    '',
    `💧 reply`,
    ...replies,
    `   └─ words with quotes or newlines? pipe them in: --what @stdin`,
  ].join('\n');
};

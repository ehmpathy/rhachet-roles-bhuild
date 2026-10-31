import type { PhoneTextRecord } from '@src/domain.objects/phone/PhoneTextRecord';

import { asPhoneTextAlias } from '../text/asPhoneTextAlias';

/**
 * .what = the message a peer receives in its session: who sent it, the words, and the exact
 *         reply command
 * .why = the text lands as the next message in the peer's session, signed, so the peer can
 *        answer with one copy and paste; the header names the uuid, the text's one name; the
 *        reply tree has its own root line, since a branch below a blank line has no trunk
 */
export const asPhoneTextSaid = (input: { record: PhoneTextRecord }): string => {
  const { record } = input;
  const alias = asPhoneTextAlias({ uuid: record.uuid });
  const reTail = record.re
    ? ` (re ${asPhoneTextAlias({ uuid: record.re })})`
    : '';
  return [
    `🦫🔔 text ${alias} from ${record.from}${reTail}`,
    '',
    record.what,
    '',
    `💧 reply`,
    `   ├─ rhx phone.text set --to ${record.from} --re ${alias} --what '...'`,
    `   └─ words with quotes or newlines? pipe them in: --what @stdin`,
  ].join('\n');
};

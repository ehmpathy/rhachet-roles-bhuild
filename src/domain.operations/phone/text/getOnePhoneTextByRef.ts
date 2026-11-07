import {
  daoPhoneMailbox,
  type PhoneMailboxEntry,
} from '@src/access/daos/daoPhoneMailbox';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { asPhoneTextArrow } from './asPhoneTextArrow';
import { asPhoneTextRef } from './asPhoneTextRef';
import { isPhoneTextRefMatch } from './isPhoneTextRefMatch';

/**
 * .what = finds the one text a reference names in this clone's mailbox, or refuses loud
 * .why = a reference is an 8-char alias or a full uuid; an alias that matches two texts is
 *        refused with both listed, never guessed, and a reference that names no text fails fast
 */
export const getOnePhoneTextByRef = async (input: {
  raw: string;
  self: PhoneSelf;
}): Promise<PhoneMailboxEntry> => {
  const ref = asPhoneTextRef({ raw: input.raw });
  // a record this clone can not read is not the one named; it never blocks a read of the rest
  const { entries } = await daoPhoneMailbox.getAllReadable({
    treeDir: input.self.treeDir,
    clone: input.self.address.clone,
  });
  const matches = entries.filter((entry) =>
    isPhoneTextRefMatch({ uuid: entry.record.uuid, ref }),
  );

  // one text answers: the common case
  if (matches.length === 1) return matches[0]!;

  // no text answers
  if (matches.length === 0)
    throw genPhoneRefusal({
      vibe: 'bummer, no text by that name',
      headline: `no text ${ref.value} in this mailbox`,
      nodes: [{ text: 'see each text with its name: rhx phone.text get' }],
    });

  // two texts answer an alias: list both by full uuid
  throw genPhoneRefusal({
    vibe: 'bummer, two fish answer to that name',
    headline: `${ref.value} matches ${matches.length} texts in this mailbox`,
    nodes: [
      ...matches.map((entry) => ({
        text: `${entry.record.uuid} ${asPhoneTextArrow({ record: entry.record })}`,
      })),
      { text: 'name one by its full uuid' },
    ],
  });
};

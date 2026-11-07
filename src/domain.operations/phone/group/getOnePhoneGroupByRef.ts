import { daoPhoneGroup } from '@src/access/daos/daoPhoneGroup';
import type { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { isPhoneTextRefMatch } from '../text/isPhoneTextRefMatch';
import { asPhoneGroupRef } from './asPhoneGroupRef';

/**
 * .what = finds the one group a reference names among this seat's groups, or refuses loud
 * .why = a group is named like a text, by its uuid: `group:<first 8>` or `group:<whole>`; an
 *        alias two groups answer to is refused with both listed, never guessed
 */
export const getOnePhoneGroupByRef = async (input: {
  raw: string;
  self: PhoneSelf;
}): Promise<PhoneGroup> => {
  const ref = asPhoneGroupRef({ raw: input.raw });
  const groups = await daoPhoneGroup.getAll({
    treeDir: input.self.treeDir,
    clone: input.self.address.clone,
  });
  const matches = groups.filter((group) =>
    isPhoneTextRefMatch({ uuid: group.uuid, ref }),
  );
  if (matches.length === 1) return matches[0]!;
  if (matches.length === 0)
    throw genPhoneRefusal({
      vibe: 'bummer, no group by that name',
      headline: `no group ${ref.value} holds this clone`,
      nodes: [
        {
          text: 'a group is minted by a text to two or more peers; see each group text: rhx phone.text get',
        },
      ],
    });
  throw genPhoneRefusal({
    vibe: 'bummer, two pods answer to that name',
    headline: `group:${ref.value} matches ${matches.length} groups`,
    nodes: [
      ...matches.map((group) => ({ text: `group:${group.uuid}` })),
      { text: 'name one by its full uuid' },
    ],
  });
};

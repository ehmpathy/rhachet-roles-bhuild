import type { PhoneMailboxEntry } from '@src/access/daos/daoPhoneMailbox';
import type { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import { asPhoneAddressString } from '../address/asPhoneAddressString';
import { getOnePhoneGroupByRef } from '../group/getOnePhoneGroupByRef';
import { isPhoneGroupRefRaw } from '../group/isPhoneGroupRefRaw';
import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { getOnePhoneTextByRef } from './getOnePhoneTextByRef';

/**
 * .what = who a send goes to: the raw peer addresses, the extant group it rides (if any), and
 *         the full uuid of the text it answers
 * .why = a send names its peers three ways — each `--into <address>`, one `--into group:<id>`, or
 *        a `--re` of a group text with no `--into`, which answers the whole group. one read
 *        settles which, so the send itself reads as narrative
 * .note = a group's members are fixed at its first text; a text to the group goes to every
 *         member but the sender
 */
export const getOnePhoneTextTargets = async (input: {
  into: string[];
  re: string | null;
  self: PhoneSelf;
}): Promise<{
  raws: string[];
  group: PhoneGroup | null;
  re: PhoneMailboxEntry | null;
}> => {
  // link a reply to the text it answers; a blank ref is refused, never dropped
  const re =
    input.re !== null
      ? await getOnePhoneTextByRef({ raw: input.re, self: input.self })
      : null;
  const rawsOfGroup = input.into.filter((raw) => isPhoneGroupRefRaw({ raw }));
  const rawsOfPeer = input.into.filter((raw) => !isPhoneGroupRefRaw({ raw }));

  // a group is named alone: a text goes to one group, or to a list of peers, never both
  if (rawsOfGroup.length > 1 || (rawsOfGroup.length && rawsOfPeer.length))
    throw genPhoneRefusal({
      vibe: 'bummer, one pod at a time',
      headline: 'a text goes to one group, or to a list of peers, not both',
      nodes: [
        { text: 'to a group: --into group:<id>' },
        { text: 'to peers: --into <address> --into <address>' },
      ],
    });

  // a group named by its ref
  const rawOfGroup = rawsOfGroup[0] ?? null;
  if (rawOfGroup !== null) {
    const group = await getOnePhoneGroupByRef({
      raw: rawOfGroup,
      self: input.self,
    });
    return {
      raws: asPhoneGroupMatesOf({ group, self: input.self }),
      group,
      re,
    };
  }

  // a reply to a group text, with no peer named, answers the whole group
  if (rawsOfPeer.length === 0 && re?.record.group) {
    const group = await getOnePhoneGroupByRef({
      raw: `group:${re.record.group}`,
      self: input.self,
    });
    return {
      raws: asPhoneGroupMatesOf({ group, self: input.self }),
      group,
      re,
    };
  }

  return { raws: rawsOfPeer, group: null, re };
};

/**
 * .what = every member of a group but the sender
 */
const asPhoneGroupMatesOf = (input: {
  group: PhoneGroup;
  self: PhoneSelf;
}): string[] => {
  const selfString = asPhoneAddressString(input.self.address);
  return input.group.members.filter((member) => member !== selfString);
};

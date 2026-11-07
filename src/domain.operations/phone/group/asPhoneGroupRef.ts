import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { PHONE_GROUP_PREFIX } from './isPhoneGroupRefRaw';

const PATTERN_ALIAS = /^[0-9a-f]{8}$/;
const PATTERN_FULL =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * .what = casts `group:<alias|uuid>` into an alias or a full uuid, or refuses it
 * .why = a group is named like a text, by its uuid; a slip names no group, so it fails fast
 */
export const asPhoneGroupRef = (input: {
  raw: string;
}): { kind: 'alias'; value: string } | { kind: 'full'; value: string } => {
  const value = input.raw.trim().toLowerCase().slice(PHONE_GROUP_PREFIX.length);
  if (PATTERN_FULL.test(value)) return { kind: 'full', value };
  if (PATTERN_ALIAS.test(value)) return { kind: 'alias', value };
  throw genPhoneRefusal({
    vibe: 'bummer, that names no group',
    headline: `${input.raw} is not a group reference`,
    nodes: [
      {
        text: 'a group is named by its uuid: group:<first 8 chars> (group:7f3e9a02) or the whole',
      },
    ],
  });
};

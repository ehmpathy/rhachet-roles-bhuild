import { genPhoneRefusal } from '../render/genPhoneRefusal';

const PATTERN_ALIAS = /^[0-9a-f]{8}$/;
const PATTERN_FULL =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * .what = casts a typed text reference into an alias or a full uuid, or refuses it
 * .why = a text is named by its uuid alone. a number is refused: a one-digit slip names a valid
 *        neighbor, and the wrong text is read or withdrawn with no error. a uuid slip names no
 *        text at all, so it fails fast
 */
export const asPhoneTextRef = (input: {
  raw: string;
}): { kind: 'alias'; value: string } | { kind: 'full'; value: string } => {
  const value = input.raw.trim().toLowerCase();
  if (PATTERN_FULL.test(value)) return { kind: 'full', value };
  if (PATTERN_ALIAS.test(value)) return { kind: 'alias', value };

  // a number gets its own refusal, since it is the mistake this rule exists to catch
  const isNumber = /^#?\d+$/.test(value);
  throw genPhoneRefusal({
    vibe: isNumber
      ? 'bummer, texts go by name, not number'
      : 'bummer, that names no text',
    headline: `${input.raw} is not a text reference`,
    nodes: [
      {
        text: 'a text is named by its uuid: the first 8 chars (7f3e9a02) or the whole',
      },
      { text: 'see each text with its name: rhx phone.text get' },
    ],
  });
};

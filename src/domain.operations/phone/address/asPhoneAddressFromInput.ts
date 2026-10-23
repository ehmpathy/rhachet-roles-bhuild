import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';

import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { asPhoneAddressString } from './asPhoneAddressString';

const KEYS_CANONICAL = ['grove', 'tree', 'clone'] as const;

/**
 * .what = casts a typed address into its canonical form, or refuses it loud
 * .why = an address arrives in three forms — the full form, `grove=local`, and `@:<clone>` —
 *        and must leave as one, with `local` cast to this grove's own name, so a hint printed
 *        for a peer on another grove never routes a reply back to that grove itself
 *
 * .note = the clone value is kept as typed (a slug, a full serial, or an 8-char short serial);
 *         the lookup of a short serial against live clones is a separate, impure step
 */
export const asPhoneAddressFromInput = (input: {
  raw: string;
  self: { grove: string; tree: string };
}): PhoneAddress => {
  const raw = input.raw.trim();

  // own-tree shorthand: @:<clone>
  if (raw.startsWith('@:')) {
    const clone = raw.slice(2);
    if (!isSegmentValueValid(clone)) throw genMalformedRefusal({ raw });
    return new PhoneAddress({
      grove: input.self.grove,
      tree: input.self.tree,
      clone,
    });
  }

  // the full form: phone://key=value/key=value/key=value
  if (!raw.startsWith('phone://')) throw genMalformedRefusal({ raw });
  const pairs = raw
    .slice('phone://'.length)
    .split('/')
    .map((segment) => {
      const at = segment.indexOf('=');
      return at < 1
        ? null
        : { key: segment.slice(0, at), value: segment.slice(at + 1) };
    });
  if (pairs.length !== 3 || pairs.some((pair) => pair === null))
    throw genMalformedRefusal({ raw });
  const entries = pairs.flatMap((pair) => (pair ? [pair] : []));

  // each key must appear once, and only the three known keys
  const keys = entries.map((entry) => entry.key);
  const isKeySetValid =
    new Set(keys).size === 3 &&
    keys.every((key) => (KEYS_CANONICAL as readonly string[]).includes(key));
  if (!isKeySetValid) throw genMalformedRefusal({ raw });

  // read the values by key, so an out-of-order address can name its canonical form
  const getKeyValue = (key: (typeof KEYS_CANONICAL)[number]): string =>
    entries.find((entry) => entry.key === key)?.value ?? '';
  const grove =
    getKeyValue('grove') === 'local' ? input.self.grove : getKeyValue('grove');
  const tree = getKeyValue('tree');
  const clone = getKeyValue('clone');
  // each value lands in a path on disk, so each is one plain segment: never empty, never `..`
  if (![grove, tree, clone].every(isSegmentValueValid))
    throw genMalformedRefusal({ raw });
  const address = new PhoneAddress({ grove, tree, clone });

  // refuse an out-of-order address, and print the form it should have been
  const isOrderCanonical = keys.every(
    (key, index) => key === KEYS_CANONICAL[index],
  );
  if (!isOrderCanonical)
    throw genPhoneRefusal({
      vibe: 'bummer, that address reads backwards',
      headline: `${raw} is not in canonical order`,
      nodes: [
        { text: 'the keys come in one order: grove, tree, clone' },
        { text: `use: ${asPhoneAddressString(address)}` },
      ],
    });

  return address;
};

/**
 * .what = a grove, tree, or clone value is one plain name: a bare slug or serial, never the `@:`
 *         shorthand inside the key, never a path a join could climb out of
 */
const isSegmentValueValid = (value: string): boolean =>
  /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);

/**
 * .what = the refusal for an address that matches no accepted form
 */
const genMalformedRefusal = (input: { raw: string }) =>
  genPhoneRefusal({
    vibe: 'bummer, that address does not parse',
    headline: `${input.raw} is not a phone address`,
    nodes: [
      {
        text: 'accepted forms',
        children: [
          { text: 'phone://grove=<grove>/tree=<tree>/clone=<clone>' },
          { text: 'phone://grove=local/tree=<tree>/clone=<clone>' },
          { text: '@:<clone>   (a clone in your own tree)' },
        ],
      },
      { text: 'see who you may reach: rhx phone.contacts get' },
    ],
  });

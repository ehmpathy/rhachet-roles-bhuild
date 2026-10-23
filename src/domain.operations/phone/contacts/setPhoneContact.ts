import { daoPhoneContacts } from '@src/access/daos/daoPhoneContacts';
import { daoPhoneContactsUses } from '@src/access/daos/daoPhoneContactsUses';
import type { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import type { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import { asPhoneAddressFromInput } from '../address/asPhoneAddressFromInput';
import { asPhoneAddressString } from '../address/asPhoneAddressString';
import type { PhoneContext } from '../PhoneContext';
import { getAllPhonePeers } from '../peer/getAllPhonePeers';
import { isPhoneShortSerial } from '../peer/isPhoneShortSerial';
import { genPhoneContactsMeterRefusal } from '../render/genPhoneContactsMeterRefusal';
import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { isPhoneRefusal } from '../render/isPhoneRefusal';
import { asPhoneContactFormsOfPeer } from './asPhoneContactFormsOfPeer';
import { asPhoneContactsWithout } from './asPhoneContactsWithout';
import { isPhoneContactOfShortSerial } from './isPhoneContactOfShortSerial';
import { isPhoneContactsMutable } from './isPhoneContactsMutable';

/**
 * .what = grants this clone a contact, or revokes one; idempotent either way
 * .why = a contact is the address a clone may text beyond its own tree. a grant checks the
 *        peer's grove and tree exist and stores the canonical form, so a peer is one contact
 *
 * .note = a grant always widens the clone that runs it (F11); no flag aims it elsewhere
 */
export const setPhoneContact = async (
  input: {
    mode: 'grant' | 'revoke';
    address: string;
    self: PhoneSelf;
    isHuman: boolean;
  },
  context: PhoneContext,
): Promise<{ address: string; contacts: string[]; isChanged: boolean }> => {
  const { self } = input;

  // only a human, or a clone whose meter is allowed, may change contacts; a human needs no meter
  // read, so a meter file no reader can parse never blocks the human who repairs it
  const meter = input.isHuman
    ? null
    : await daoPhoneContactsUses.getOne({ treeDir: self.treeDir });
  if (meter && !isPhoneContactsMutable({ isHuman: input.isHuman, meter }))
    throw genPhoneContactsMeterRefusal({ meter });

  // cast the address to its canonical form
  const parsed = asPhoneAddressFromInput({
    raw: input.address,
    self: { grove: context.groveSelf, tree: self.address.tree },
  });
  // a contacts file no reader can parse reads as no grants; the write below replaces it
  const { addresses: contactsBefore } = await daoPhoneContacts.getAll({
    treeDir: self.treeDir,
    clone: self.address.clone,
  });

  // a revoke matches every stored form of the peer; a peer that is gone must still go
  if (input.mode === 'revoke') {
    const forms = await getAllPhoneContactFormsOfRevoke(
      { parsed, self, contacts: contactsBefore },
      context,
    );
    const contacts = asPhoneContactsWithout({
      contacts: contactsBefore,
      forms,
    });
    const isChanged = contacts.length !== contactsBefore.length;
    if (isChanged)
      await daoPhoneContacts.set({
        treeDir: self.treeDir,
        clone: self.address.clone,
        addresses: contacts,
      });
    return { address: forms[0]!, contacts, isChanged };
  }

  // a grant checks the peer's grove and tree, and expands a short serial
  const [peer] = await getAllPhonePeers({ addresses: [parsed], self }, context);
  const address = asPhoneAddressString(peer!.address);

  // a clone's own tree and its own self need no contact
  if (peer!.treeDir === self.treeDir)
    throw genPhoneRefusal({
      vibe: 'no need, that one is already in your pond',
      headline: `${address} is in this clone's own tree`,
      nodes: [
        {
          text: `text it as is: rhx phone.text set --to ${address} --what '...'`,
        },
      ],
    });

  const isChanged = !contactsBefore.includes(address);
  const contacts = isChanged
    ? await daoPhoneContacts.set({
        treeDir: self.treeDir,
        clone: self.address.clone,
        addresses: [...contactsBefore, address],
      })
    : contactsBefore;
  return { address, contacts, isChanged };
};

/**
 * .what = every stored form a revoke must remove: the typed form, the peer's slug form and full
 *         serial form when the peer can be looked up, and, for a short serial whose tree is gone,
 *         the one stored contact it prefixes
 * .why = a contact is stored by the slug or the full serial it held at grant time; a revoke typed
 *        as `@:4c1e8b27`, or by a slug the clone gained later, must still find it — else the
 *        revoke reports "no change" while the contact stays
 */
const getAllPhoneContactFormsOfRevoke = async (
  input: { parsed: PhoneAddress; self: PhoneSelf; contacts: string[] },
  context: PhoneContext,
): Promise<string[]> => {
  const { parsed } = input;
  const typed = asPhoneAddressString(parsed);

  // look the peer up; a gone tree or clone is a refusal, and the revoke goes on without it
  const peer = await getAllPhonePeers(
    { addresses: [parsed], self: input.self },
    context,
  ).then(
    ([found]) => found ?? null,
    (error: unknown) => {
      if (isPhoneRefusal(error)) return null;
      throw error;
    },
  );
  if (peer) return asPhoneContactFormsOfPeer({ peer, typed });

  // a short serial whose peer is gone: the one stored contact in that tree it prefixes
  if (!isPhoneShortSerial({ name: parsed.clone })) return [typed];
  const matches = input.contacts.filter((contact) =>
    isPhoneContactOfShortSerial({ contact, parsed }),
  );
  if (matches.length > 1)
    throw genPhoneRefusal({
      vibe: 'bummer, two contacts answer to that serial',
      headline: `@:${parsed.clone} matches ${matches.length} contacts`,
      nodes: [
        ...matches.map((contact) => ({ text: contact })),
        { text: 'revoke one by its full address' },
      ],
    });
  return [matches[0] ?? typed];
};

/**
 * .what = cli entry point for the phone.contacts skill
 * .why  = who a clone may text beyond its own tree; a grant is per clone, and gated by the
 *         tree's `phone.contacts.uses` meter unless a human runs it
 *
 * usage:
 *   phone.contacts get
 *   phone.contacts set --address <address>
 *   phone.contacts del --address <address>
 *
 * guarantee:
 *   - runs only inside an enrolled clone; changes that clone's contacts alone (F11, F12)
 *   - set and del are idempotent; a grant checks the peer's grove and tree exist
 *   - a clone's set or del fails loud (exit 2) while its tree meter is not allowed
 */
import { z } from 'zod';

import { getAllPhoneContacts } from '@src/domain.operations/phone/contacts/getAllPhoneContacts';
import { setPhoneContact } from '@src/domain.operations/phone/contacts/setPhoneContact';
import { asPhoneContactsGetOutput } from '@src/domain.operations/phone/render/asPhoneContactsGetOutput';
import { asPhoneContactsSetOutput } from '@src/domain.operations/phone/render/asPhoneContactsSetOutput';
import { getOnePhoneSelf } from '@src/domain.operations/phone/self/getOnePhoneSelf';
import { getCliArgs } from '@src/infra/cli';
import { getAllCliArgValuesOrOne } from '@src/infra/cli/getAllCliArgValuesOrOne';

import { asPhoneAddressesUnique } from './phone/asPhoneAddressesUnique';
import { asPhoneFlagValue } from './phone/asPhoneFlagValue';
import { assertPhoneFlagGiven } from './phone/assertPhoneFlagGiven';
import { assertPhoneVerbKnown } from './phone/assertPhoneVerbKnown';
import { getPhoneContextFromEnv } from './phone/getPhoneContextFromEnv';
import { isPhoneCallerHuman } from './phone/isPhoneCallerHuman';
import { withPhoneRefusalVibe } from './phone/withPhoneRefusalVibe';

const schemaOfArgs = z.object({
  named: z.object({
    help: z.boolean().optional(),
    h: z.boolean().optional(),
    address: z.union([z.string(), z.boolean()]).optional(),

    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

const HELP_TEXT = `
🦫 here's who you may reach

💧 phone.contacts --help
   ├─ usage
   │  ├─ phone.contacts get                       this clone's contacts + own tree, with reach state
   │  ├─ phone.contacts set --address <address>   grant; idempotent
   │  └─ phone.contacts del --address <address>   revoke; idempotent
   │
   └─ set and del need a human, or a clone whose meter is allowed: rhx phone.contacts.uses get
`.trim();

const _cliPhoneContacts = async (): Promise<void> => {
  const { named, ordered } = getCliArgs({ schema: schemaOfArgs });
  const verb = ordered[0] ?? null;

  // handle --help, or an absent verb
  if (named.help || named.h || !verb) {
    console.log(HELP_TEXT);
    return;
  }

  // refuse a verb the phone does not know, before any clone lookup
  assertPhoneVerbKnown({
    skill: 'phone.contacts',
    verb,
    known: ['get', 'set', 'del'],
    usage: ['get', 'set --address <address>', 'del --address <address>'],
  });

  // refuse a grant or revoke that names no peer, before any clone lookup; --address repeats
  const addressesGiven =
    verb === 'get'
      ? null
      : getAllCliArgValuesOrOne({
          key: 'address',
          argv: process.argv,
          parsed: asPhoneFlagValue(named.address),
        });
  const asAddressGiven = (raw: string | boolean | undefined) =>
    assertPhoneFlagGiven({
      skill: 'phone.contacts',
      verb,
      flag: 'address',
      raw,
      takes: 'a peer address, phone://grove=<grove>/tree=<tree>/clone=<clone>',
      usage: `${verb} --address <address>`,
    });
  const addresses =
    addressesGiven === null
      ? null
      : asPhoneAddressesUnique({ addresses: addressesGiven }).map(
          asAddressGiven,
        );
  if (addresses !== null && addresses.length === 0)
    asAddressGiven(named.address);
  const duplicates =
    addresses === null ? 0 : addressesGiven!.length - addresses.length;

  // find the clone this verb runs as
  const context = getPhoneContextFromEnv({
    env: process.env,
    roster: 'memo',
  });
  const self = await getOnePhoneSelf(
    {
      serial: process.env.RHACHET_CLONE_SERIAL || null,
      pitch: verb === 'get' ? null : 'meter',
    },
    context,
  );

  // read
  if (addresses === null) {
    const result = await getAllPhoneContacts({ self }, context);
    console.log(asPhoneContactsGetOutput({ self, ...result }));
    return;
  }

  // grant or revoke each address in turn; each is idempotent, so a rerun converges
  const mode = verb === 'set' ? 'grant' : 'revoke';
  for (const [index, address] of addresses.entries()) {
    // a blank line between trees, so each address reads as its own block
    if (index > 0) console.log('');
    const result = await setPhoneContact(
      {
        mode,
        address,
        self,
        isHuman: isPhoneCallerHuman({ env: process.env }),
      },
      context,
    );
    console.log(
      asPhoneContactsSetOutput({
        mode,
        ...result,
        // the repeat note rides the last block, once every address has converged
        duplicates: index === addresses.length - 1 ? duplicates : 0,
      }),
    );
  }
};

export const cliPhoneContacts = withPhoneRefusalVibe(_cliPhoneContacts);

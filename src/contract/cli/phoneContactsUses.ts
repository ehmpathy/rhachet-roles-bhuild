/**
 * .what = cli entry point for the phone.contacts.uses skill
 * .why  = the meter decides whether the clones of a tree may manage their own contacts; blocked
 *         by default, always; only a human may lift or drop it
 *
 * usage:
 *   phone.contacts.uses get
 *   phone.contacts.uses allow
 *   phone.contacts.uses block
 *
 * guarantee:
 *   - state in .meter/phone.contacts.uses.jsonc of this tree; unset reads as blocked
 *   - allow and block need a human (a tty, or __I_AM_HUMAN=true); a clone fails loud, exit 2
 */
import { z } from 'zod';

import { getOnePhoneContactsUses } from '@src/domain.operations/phone/contacts/getOnePhoneContactsUses';
import { setPhoneContactsUses } from '@src/domain.operations/phone/contacts/setPhoneContactsUses';
import { asPhoneOutput } from '@src/domain.operations/phone/render/asPhoneOutput';
import { genPhoneRefusal } from '@src/domain.operations/phone/render/genPhoneRefusal';
import { getOnePhoneTreeDirOfCwd } from '@src/domain.operations/phone/tree/getOnePhoneTreeDirOfCwd';
import { getCliArgs } from '@src/infra/cli';

import { assertPhoneVerbKnown } from './phone/assertPhoneVerbKnown';
import { isPhoneCallerHuman } from './phone/isPhoneCallerHuman';
import { withPhoneRefusalVibe } from './phone/withPhoneRefusalVibe';

const schemaOfArgs = z.object({
  named: z.object({
    help: z.boolean().optional(),
    h: z.boolean().optional(),

    // rhachet passthrough args (optional, ignored)
    repo: z.string().optional(),
    role: z.string().optional(),
    skill: z.string().optional(),
    s: z.string().optional(),
  }),
  ordered: z.array(z.string()).default([]),
});

const HELP_TEXT = `
🦫 here's the dam

💧 phone.contacts.uses --help
   ├─ usage
   │  ├─ phone.contacts.uses get     may this tree's clones manage their own contacts?
   │  ├─ phone.contacts.uses allow   lift the meter (human only)
   │  └─ phone.contacts.uses block   drop the meter (human only)
   │
   └─ blocked by default; unset reads as blocked
`.trim();

const _cliPhoneContactsUses = async (): Promise<void> => {
  const { named, ordered } = getCliArgs({ schema: schemaOfArgs });
  const verb = ordered[0] ?? null;

  // handle --help, or an absent verb
  if (named.help || named.h || !verb) {
    console.log(HELP_TEXT);
    return;
  }

  // refuse a verb the phone does not know, before any tree lookup
  assertPhoneVerbKnown({
    skill: 'phone.contacts.uses',
    verb,
    known: ['get', 'allow', 'block'],
    usage: ['get', 'allow', 'block'],
  });
  const treeDir = getOnePhoneTreeDirOfCwd();

  // read
  if (verb === 'get') {
    const state = await getOnePhoneContactsUses({ treeDir });
    console.log(
      asPhoneOutput({
        vibe: state === 'allowed' ? 'the dam is open' : 'the dam holds',
        root: 'phone.contacts.uses',
        nodes: [
          {
            text: `state: ${state === 'unset' ? 'blocked (default)' : state}`,
          },
        ],
      }),
    );
    return;
  }

  // lift or drop, human only
  if (verb === 'allow' || verb === 'block') {
    if (!isPhoneCallerHuman({ env: process.env }))
      throw genPhoneRefusal({
        vibe: 'only a human works the dam',
        headline: `phone.contacts.uses ${verb} needs a human`,
        nodes: [{ text: 'run it from a terminal, as a human' }],
      });
    const { before, after: state } = await setPhoneContactsUses({
      treeDir,
      state: verb === 'allow' ? 'allowed' : 'blocked',
    });
    console.log(
      asPhoneOutput({
        vibe: state === 'allowed' ? 'the dam is open' : 'the dam holds',
        root: `phone.contacts.uses ${verb}`,
        nodes: [
          {
            text: `state: ${before === 'unset' ? 'blocked (default)' : before} → ${state}`,
          },
        ],
      }),
    );
    return;
  }
};

export const cliPhoneContactsUses = withPhoneRefusalVibe(_cliPhoneContactsUses);

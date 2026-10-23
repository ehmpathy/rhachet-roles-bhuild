import { basename } from 'path';

import { PhoneAddress } from '@src/domain.objects/phone/PhoneAddress';
import { PhoneSelf } from '@src/domain.objects/phone/PhoneSelf';

import type { PhoneContext } from '../PhoneContext';
import { genPhoneRefusal } from '../render/genPhoneRefusal';
import { getOnePhoneTreeDirOfCwd } from '../tree/getOnePhoneTreeDirOfCwd';

/**
 * .what = finds the clone this phone verb runs as
 * .why = a text is sent from, and read in, the mailbox of the clone that runs the verb; its
 *        name (the slug, or the serial where it has none) keys the seat and names the address
 *
 * .note = the serial comes from `RHACHET_CLONE_SERIAL`, which rhachet sets in every tool call a
 *         clone makes; one `clone list` names its slug. `clone whoami` is not used: it takes
 *         seconds, and it reads the same env var
 */
export const getOnePhoneSelf = async (
  input: { serial: string | null },
  context: Pick<PhoneContext, 'groveSelf' | 'sdkClone'>,
): Promise<PhoneSelf> => {
  // a phone verb must run inside an enrolled clone
  if (!input.serial)
    throw genPhoneRefusal({
      vibe: 'bummer, no clone holds this phone',
      headline: 'the phone runs only inside an enrolled clone',
      nodes: [
        { text: 'RHACHET_CLONE_SERIAL is not set in this shell' },
        { text: 'run it from a clone: rhx enroll claude --as @:<slug>' },
        {
          text: 'a human who grants a clone its contacts: lift the meter here, then the clone grants',
          children: [
            { text: 'rhx phone.contacts.uses allow' },
            {
              text: 'then, in the clone: rhx phone.contacts set --address <address>',
            },
          ],
        },
      ],
    });

  // find the tree the clone works in
  const treeDir = getOnePhoneTreeDirOfCwd();

  // find the clone's slug, if it has one
  const clones = await context.sdkClone.getAllClones({ treeDir });
  const found = clones.find((clone) => clone.serial === input.serial);
  if (!found)
    throw genPhoneRefusal({
      vibe: 'bummer, this clone is not on the roster here',
      headline: `no clone ${input.serial} is enrolled in ${basename(treeDir)}`,
      nodes: [
        { text: 'the phone signs each text with the clone that sends it' },
        { text: 'see the roster: rhx clone list' },
      ],
    });

  return new PhoneSelf({
    serial: found.serial,
    treeDir,
    address: new PhoneAddress({
      grove: context.groveSelf,
      tree: basename(treeDir),
      clone: found.slug ?? found.serial,
    }),
  });
};

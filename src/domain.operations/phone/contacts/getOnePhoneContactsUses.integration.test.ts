import { promises as fs } from 'fs';
import { MalfunctionError } from 'helpful-errors';
import { join } from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { isPhoneMalfunction } from '../render/isPhoneMalfunction';
import { getOnePhoneContactsUses } from './getOnePhoneContactsUses';

describe('getOnePhoneContactsUses', () => {
  given('[case1] a tree whose meter file has an unknown shape', () => {
    when('[t0] the meter is read', () => {
      const result = useThen('it fails loud', async () => {
        const treeDir = genTempDir({ slug: 'get-phone-contacts-uses-case1' });
        await fs.mkdir(join(treeDir, '.meter'), { recursive: true });
        await fs.writeFile(
          join(treeDir, '.meter', 'phone.contacts.uses.jsonc'),
          '{ "state": "ajar" }\n',
        );
        return { error: await getError(getOnePhoneContactsUses({ treeDir })) };
      });

      then('it is a malfunction, never read as a state', () => {
        expect(result.error).toBeInstanceOf(MalfunctionError);
      });

      then('it is a phone malfunction, so it leads with a vibe line', () => {
        expect(isPhoneMalfunction(result.error)).toEqual(true);
      });

      then('its tree names the file and the cure', () => {
        expect(result.error.message).toContain(
          'phone.contacts.uses meter has an unknown shape',
        );
        expect(result.error.message).toContain('phone.contacts.uses.jsonc');
        expect(result.error.message).toContain(
          'a human rewrites it: rhx phone.contacts.uses block (or allow)',
        );
      });
    });
  });

  given('[case2] a tree with no meter', () => {
    when('[t0] the meter is read', () => {
      const result = useThen('it reads unset', async () => {
        const treeDir = genTempDir({ slug: 'get-phone-contacts-uses-case2' });
        return { state: await getOnePhoneContactsUses({ treeDir }) };
      });

      then('an absent meter reads unset', () => {
        expect(result.state).toEqual('unset');
      });
    });
  });
});

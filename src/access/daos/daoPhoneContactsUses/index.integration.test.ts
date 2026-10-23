import { promises as fs } from 'fs';
import { join } from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { daoPhoneContactsUses } from './index';

describe('daoPhoneContactsUses', () => {
  given('[case1] a tree with no meter', () => {
    when('[t0] the meter is read', () => {
      const result = useThen('it reads unset', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-contacts-uses-case1' });
        return { state: await daoPhoneContactsUses.getOne({ treeDir }) };
      });

      then('an absent meter reads unset, never allowed', () => {
        expect(result.state).toEqual('unset');
      });
    });
  });

  given('[case2] a tree whose meter is set', () => {
    when('[t0] it is allowed, then blocked', () => {
      const result = useThen('each write reads back', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-contacts-uses-case2' });
        await daoPhoneContactsUses.set({ treeDir, state: 'allowed' });
        const afterAllow = await daoPhoneContactsUses.getOne({ treeDir });
        await daoPhoneContactsUses.set({ treeDir, state: 'blocked' });
        const afterBlock = await daoPhoneContactsUses.getOne({ treeDir });
        const ignore = await fs.readFile(
          join(treeDir, '.meter', '.gitignore'),
          'utf8',
        );
        const names = await fs.readdir(join(treeDir, '.meter'));
        return { afterAllow, afterBlock, ignore, names };
      });

      then('allow reads back allowed', () => {
        expect(result.afterAllow).toEqual('allowed');
      });

      then('block reads back blocked', () => {
        expect(result.afterBlock).toEqual('blocked');
      });

      then('the meter dir ignores itself, so the state is never staged', () => {
        expect(result.ignore).toEqual('*\n');
      });

      then('no temp file is left behind', () => {
        expect(result.names.sort()).toEqual([
          '.gitignore',
          'phone.contacts.uses.jsonc',
        ]);
      });
    });
  });

  given('[case3] a meter file that is not json', () => {
    when('[t0] the meter is read', () => {
      const result = useThen('it fails loud', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-contacts-uses-case3' });
        await fs.mkdir(join(treeDir, '.meter'), { recursive: true });
        await fs.writeFile(
          join(treeDir, '.meter', 'phone.contacts.uses.jsonc'),
          'allowed, trust me\n',
        );
        const error = await getError(daoPhoneContactsUses.getOne({ treeDir }));
        return { message: error.message };
      });

      then('a corrupt meter is a malfunction, never read as allowed', () => {
        expect(result.message).toContain(
          'phone.contacts.uses meter has an unknown shape',
        );
      });
    });
  });
});

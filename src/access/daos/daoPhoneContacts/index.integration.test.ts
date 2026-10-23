import { promises as fs } from 'fs';
import { join } from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { daoPhoneContacts } from './index';

const DIRECTOR = 'phone://grove=bert-laptop/tree=notebook/clone=director';

/**
 * .what = the path the dao keeps one seat's contacts at, for a test to read or corrupt
 */
const asContactsPath = (input: { treeDir: string; clone: string }): string =>
  join(
    input.treeDir,
    '.agent/.cache/repo=bhuild/role=dispatcher/skill=phone.contacts',
    `clone=${input.clone}`,
    'contacts.json',
  );

describe('daoPhoneContacts', () => {
  given('[case1] a tree with two seats', () => {
    when('[t0] the mechanic is granted the director, twice', () => {
      const result = useThen(
        'the grant holds once, for the mechanic only',
        async () => {
          const treeDir = genTempDir({ slug: 'dao-phone-contacts-case1' });
          await daoPhoneContacts.set({
            treeDir,
            clone: 'mechanic',
            addresses: [DIRECTOR],
          });
          await daoPhoneContacts.set({
            treeDir,
            clone: 'mechanic',
            addresses: [DIRECTOR, DIRECTOR],
          });
          return {
            mechanic: await daoPhoneContacts.getAll({
              treeDir,
              clone: 'mechanic',
            }),
            foreman: await daoPhoneContacts.getAll({
              treeDir,
              clone: 'foreman',
            }),
            bytes: await fs.readFile(
              asContactsPath({ treeDir, clone: 'mechanic' }),
              'utf8',
            ),
          };
        },
      );

      then('the mechanic holds the director once', () => {
        expect(result.mechanic).toEqual({
          addresses: [DIRECTOR],
          unreadable: null,
        });
      });

      then('the foreman holds no contact: contacts are per seat', () => {
        expect(result.foreman).toEqual({ addresses: [], unreadable: null });
      });

      then('the file carries its format version, so it can grow', () => {
        expect(JSON.parse(result.bytes)).toEqual({
          v: 1,
          addresses: [DIRECTOR],
        });
      });
    });
  });

  given('[case2] a contacts file no reader here can parse', () => {
    when('[t0] it is read, then a grant is written', () => {
      const result = useThen(
        'the read names the file, and the grant replaces it',
        async () => {
          const treeDir = genTempDir({ slug: 'dao-phone-contacts-case2' });
          const path = asContactsPath({ treeDir, clone: 'mechanic' });
          await fs.mkdir(join(path, '..'), { recursive: true });
          await fs.writeFile(path, JSON.stringify([DIRECTOR]));
          const before = await daoPhoneContacts.getAll({
            treeDir,
            clone: 'mechanic',
          });
          await daoPhoneContacts.set({
            treeDir,
            clone: 'mechanic',
            addresses: [DIRECTOR],
          });
          const after = await daoPhoneContacts.getAll({
            treeDir,
            clone: 'mechanic',
          });
          return { before, after, path };
        },
      );

      then('the read grants none, and names the file — never a crash', () => {
        expect(result.before.addresses).toEqual([]);
        expect(result.before.unreadable?.path).toEqual(result.path);
      });

      then('a grant rewrites it in the current shape', () => {
        expect(result.after).toEqual({
          addresses: [DIRECTOR],
          unreadable: null,
        });
      });
    });
  });
});

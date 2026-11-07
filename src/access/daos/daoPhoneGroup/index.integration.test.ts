import { promises as fs } from 'fs';
import { join } from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';

import { getOnePhoneCacheDir } from '../getOnePhoneCacheDir';
import { daoPhoneGroup } from './index';

const DIRECTOR = 'phone://grove=bert-laptop/tree=notebook/clone=director';
const MECHANIC =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=mechanic';
const FOREMAN =
  'phone://grove=bert-laptop/tree=svc-lessons.beav.feat-book-a-lesson/clone=foreman';
const UUID = '0c5e8f1a-41c6-4b0e-9d2a-0c5e8f1a3b77';

/**
 * .what = the dir one seat's mailbox lives in, where its group files sit
 */
const getDirOfSeat = (input: { treeDir: string; clone: string }): string =>
  join(
    getOnePhoneCacheDir({ treeDir: input.treeDir }),
    'skill=phone.text',
    `clone=${input.clone}`,
  );

describe('daoPhoneGroup', () => {
  given('[case1] a seat that holds no group', () => {
    when('[t0] its groups are read', () => {
      const result = useThen('none are found', async () => ({
        groups: await daoPhoneGroup.getAll({
          treeDir: genTempDir({ slug: 'dao-phone-group-case1' }),
          clone: 'mechanic',
        }),
      }));

      then('the list is empty, and no dir is made', () => {
        expect(result.groups).toEqual([]);
      });
    });
  });

  given('[case2] a group written into a seat', () => {
    when('[t0] the same group is written twice', () => {
      const result = useThen('the second write finds the first', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-group-case2' });
        const group = new PhoneGroup({
          uuid: UUID,
          members: [DIRECTOR, MECHANIC, FOREMAN],
        });
        const first = await daoPhoneGroup.gen({
          treeDir,
          clone: 'mechanic',
          group,
        });

        // a rerun carries other members; the first write stands
        const second = await daoPhoneGroup.gen({
          treeDir,
          clone: 'mechanic',
          group: new PhoneGroup({ uuid: UUID, members: [DIRECTOR, MECHANIC] }),
        });
        const names = (
          await fs.readdir(getDirOfSeat({ treeDir, clone: 'mechanic' }))
        ).filter((name) => name.startsWith('group.'));
        return {
          first,
          second,
          names,
          groups: await daoPhoneGroup.getAll({ treeDir, clone: 'mechanic' }),
        };
      });

      then('one file holds it, named by its uuid', () => {
        expect(result.names).toEqual([`group.${UUID}.json`]);
      });

      then('the group is findserted: the first members stand', () => {
        expect(result.first.members).toEqual([DIRECTOR, MECHANIC, FOREMAN]);
        expect(result.second.members).toEqual([DIRECTOR, MECHANIC, FOREMAN]);
        expect(result.groups).toHaveLength(1);
      });

      then('another seat holds none of it', async () => {
        expect(
          await daoPhoneGroup.getAll({
            treeDir: genTempDir({ slug: 'dao-phone-group-case2-other' }),
            clone: 'foreman',
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case3] a seat whose dir holds files a reader can not use', () => {
    when('[t0] its groups are read', () => {
      const result = useThen('each bad file is skipped', async () => {
        const treeDir = genTempDir({ slug: 'dao-phone-group-case3' });
        await daoPhoneGroup.gen({
          treeDir,
          clone: 'mechanic',
          group: new PhoneGroup({
            uuid: UUID,
            members: [DIRECTOR, MECHANIC],
          }),
        });
        const dir = getDirOfSeat({ treeDir, clone: 'mechanic' });

        // not json; a version no reader here knows; too few members; a text record beside them
        await fs.writeFile(
          join(dir, 'group.1a2b3c4d-0000-4000-8000-000000000001.json'),
          '{ not json',
        );
        await fs.writeFile(
          join(dir, 'group.1a2b3c4d-0000-4000-8000-000000000002.json'),
          JSON.stringify({
            v: 2,
            uuid: 'future',
            members: [DIRECTOR, MECHANIC],
          }),
        );
        await fs.writeFile(
          join(dir, 'group.1a2b3c4d-0000-4000-8000-000000000003.json'),
          JSON.stringify({
            v: 1,
            uuid: '1a2b3c4d-0000-4000-8000-000000000003',
            members: [DIRECTOR],
          }),
        );
        await fs.writeFile(join(dir, 'text.0001.out.json'), '{}');
        return {
          groups: await daoPhoneGroup.getAll({ treeDir, clone: 'mechanic' }),
        };
      });

      then('only the readable group is returned', () => {
        expect(result.groups.map((group) => group.uuid)).toEqual([UUID]);
      });
    });
  });
});

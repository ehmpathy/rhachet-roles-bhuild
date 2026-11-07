import { promises as fs } from 'fs';
import { join } from 'path';
import { z } from 'zod';

import { PhoneGroup } from '@src/domain.objects/phone/PhoneGroup';
import { genFileExclusive } from '@src/infra/fs/genFileExclusive';

import { genPhoneCacheDir } from '../genPhoneCacheDir';
import { getOnePhoneCacheDir } from '../getOnePhoneCacheDir';

/**
 * .what = the format version every group file carries
 * .why = a group file is written into another tree's mailbox, and may be read by an older or a
 *        newer rhachet-roles-bhuild; a version a reader does not know is skipped, never a crash
 */
const PHONE_GROUP_VERSION = 1;

const schemaOfGroup = z.object({
  v: z.literal(PHONE_GROUP_VERSION),
  uuid: z.string(),
  members: z.array(z.string()).min(2),
});

const PATTERN_FILE = /^group\.([0-9a-f-]+)\.json$/;

/**
 * .what = the dir one seat's mailbox lives in, where its group files sit beside its texts
 */
const getMailboxDir = (input: { treeDir: string; clone: string }): string =>
  join(
    getOnePhoneCacheDir({ treeDir: input.treeDir }),
    'skill=phone.text',
    `clone=${input.clone}`,
  );

/**
 * .what = every group this seat is a member of; a file no reader here can parse is skipped
 */
const getAll = async (input: {
  treeDir: string;
  clone: string;
}): Promise<PhoneGroup[]> => {
  const dir = getMailboxDir(input);
  const names = await fs.readdir(dir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  const groups = await Promise.all(
    names
      .filter((name) => PATTERN_FILE.test(name))
      .sort()
      .map(async (name) => {
        const text = await fs.readFile(join(dir, name), 'utf8');
        const parsed = schemaOfGroup.safeParse(
          ((): unknown => {
            try {
              return JSON.parse(text);
            } catch (error) {
              if (error instanceof SyntaxError) return null;
              throw error;
            }
          })(),
        );
        if (!parsed.success) return null;
        const { v: _version, ...group } = parsed.data;
        return new PhoneGroup(group);
      }),
  );
  return groups.flatMap((group) => (group ? [group] : []));
};

/**
 * .what = findserts a group file into one seat's mailbox, by the group's uuid
 * .why = a group is written once per member; a re-run of the send, or of the intake on another
 *        grove, finds the extant file and writes naught
 * .note = a group's members are fixed at its first text, so an extant file is never rewritten
 */
const gen = async (input: {
  treeDir: string;
  clone: string;
  group: PhoneGroup;
}): Promise<PhoneGroup> => {
  await genPhoneCacheDir({ treeDir: input.treeDir });
  const dir = getMailboxDir(input);
  await fs.mkdir(dir, { recursive: true });
  const bytes = `${JSON.stringify(
    {
      v: PHONE_GROUP_VERSION,
      uuid: input.group.uuid,
      members: input.group.members,
    },
    null,
    2,
  )}\n`;
  await genFileExclusive({
    path: join(dir, `group.${input.group.uuid}.json`),
    bytes,
  });
  const found = (await getAll(input)).find(
    (group) => group.uuid === input.group.uuid,
  );
  return found ?? input.group;
};

export const daoPhoneGroup = { getAll, gen };

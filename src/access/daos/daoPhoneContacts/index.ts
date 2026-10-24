import { promises as fs } from 'fs';
import { join } from 'path';
import { z } from 'zod';

import { genPhoneCacheDir } from '../genPhoneCacheDir';
import { getOnePhoneCacheDir } from '../getOnePhoneCacheDir';

/**
 * .what = the format version the contacts file carries
 * .why = each tree runs its own installed rhachet-roles-bhuild, so a reader meets a file a newer
 *        writer wrote. an object with a version can grow a field; a bare list never can
 */
const PHONE_CONTACTS_VERSION = 1;

const schemaOfContacts = z.object({
  v: z.literal(PHONE_CONTACTS_VERSION),
  addresses: z.array(z.string()),
});

/**
 * .what = the file one seat's contacts live in
 * .why = contacts key by the clone's name — its slug, or its serial where it has none — so a grant
 *        made to a seat holds for whatever clone sits there next
 */
const getContactsPath = (input: { treeDir: string; clone: string }): string =>
  join(
    getOnePhoneCacheDir({ treeDir: input.treeDir }),
    'skill=phone.contacts',
    `clone=${input.clone}`,
    'contacts.json',
  );

/**
 * .what = reads one seat's contacts, as canonical address strings, and names the file when it
 *         can not be read
 * .why = a contacts file this reader can not read (a newer writer's, a hand-edited one) reads as
 *        no grants, named back: it must not block a send to a clone of the own tree, nor the
 *        `phone.contacts` command that rewrites it
 */
const getAll = async (input: {
  treeDir: string;
  clone: string;
}): Promise<{
  addresses: string[];
  unreadable: { path: string; reason: string } | null;
}> => {
  const path = getContactsPath(input);
  const text = await fs
    .readFile(path, 'utf8')
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
  if (text === null) return { addresses: [], unreadable: null };
  const parsed = schemaOfContacts.safeParse(
    ((): unknown => {
      try {
        return JSON.parse(text);
      } catch (error) {
        if (error instanceof SyntaxError) return null;
        throw error;
      }
    })(),
  );
  if (!parsed.success)
    return {
      addresses: [],
      unreadable: {
        path,
        reason: 'phone contacts file has an unknown shape',
      },
    };
  return { addresses: parsed.data.addresses, unreadable: null };
};

/**
 * .what = writes one seat's contacts, deduped and sorted
 * .why = a sorted, deduped list makes a grant and a revoke idempotent byte for byte
 */
const set = async (input: {
  treeDir: string;
  clone: string;
  addresses: string[];
}): Promise<string[]> => {
  const addresses = [...new Set(input.addresses)].sort();
  await genPhoneCacheDir({ treeDir: input.treeDir });
  const path = getContactsPath(input);
  await fs.mkdir(join(path, '..'), { recursive: true });
  const temp = `${path}.tmp.${process.pid}`;
  const shape = { v: PHONE_CONTACTS_VERSION, addresses };
  await fs.writeFile(temp, `${JSON.stringify(shape, null, 2)}\n`);
  await fs.rename(temp, path);
  return addresses;
};

export const daoPhoneContacts = { getAll, set };

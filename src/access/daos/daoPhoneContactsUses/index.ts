import { promises as fs } from 'fs';
import { join } from 'path';
import { z } from 'zod';

/**
 * .what = the state of a tree's `phone.contacts.uses` meter; `unset` reads as blocked
 */
export type PhoneContactsUsesState = 'allowed' | 'blocked' | 'unset';

const schemaOfMeter = z.object({ state: z.enum(['allowed', 'blocked']) });

/**
 * .what = the meter file, beside the tree's other `.meter/` state (the `radio.uses` pattern)
 */
const getMeterPath = (input: { treeDir: string }): string =>
  join(input.treeDir, '.meter', 'phone.contacts.uses.jsonc');

/**
 * .what = reads the meter as it lies on disk, `unreadable` where its shape is unknown
 * .why = the setter must overwrite an unreadable meter, so the read that it does first may not
 *        throw; every gate reads through `getOnePhoneContactsUses`, which fails loud on it
 */
const getOneAsFound = async (input: {
  treeDir: string;
}): Promise<PhoneContactsUsesState | 'unreadable'> => {
  const text = await fs
    .readFile(getMeterPath(input), 'utf8')
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });
  if (text === null) return 'unset';
  const parsed = schemaOfMeter.safeParse(
    ((): unknown => {
      try {
        return JSON.parse(text);
      } catch (error) {
        if (error instanceof SyntaxError) return null;
        throw error;
      }
    })(),
  );
  return parsed.success ? parsed.data.state : 'unreadable';
};

/**
 * .what = writes the meter, and a self-ignore beside it so the state is never staged
 */
const set = async (input: {
  treeDir: string;
  state: 'allowed' | 'blocked';
}): Promise<PhoneContactsUsesState> => {
  const path = getMeterPath(input);
  const dir = join(path, '..');
  await fs.mkdir(dir, { recursive: true });
  await fs
    .writeFile(join(dir, '.gitignore'), '*\n', { flag: 'wx' })
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'EEXIST') return;
      throw error;
    });
  const temp = `${path}.tmp.${process.pid}`;
  await fs.writeFile(
    temp,
    `${JSON.stringify({ state: input.state }, null, 2)}\n`,
  );
  await fs.rename(temp, path);
  return input.state;
};

export const daoPhoneContactsUses = {
  getOneAsFound,
  getOnePath: getMeterPath,
  set,
};

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * .what = the `.gitignore` a radio lock dir holds: ignore every file in it
 * .why = the lock file holds a lease clock (`expiresAtMse`), and a crashed drain leaves it on
 *        disk. a consumer that tracks its `.radio/` dirs must never commit it
 *        (rule.forbid.timestamps-in-tracked-files)
 */
const LOCK_DIR_IGNORE = '*\n';

/**
 * .what = findsert the lock dir and its self-ignore
 * .why = a lock is a moment's mutual exclusion, with no sense once the moment ends; git
 *        should never see it, whether the drain exited clean or crashed
 *
 * .note = findsert, like the dispatcher's `findsert_meter_dir`: an extant `.gitignore` is kept,
 *         so a human's edit is never overwritten
 */
export const genRadioLockDirIgnore = (input: { dir: string }): void => {
  // findsert the lock dir
  mkdirSync(input.dir, { recursive: true });

  // write the ignore only if absent; the exclusive create is atomic, so two drains that race
  // here cannot both write, and an extant ignore (a human's edit among them) is kept as found
  const path = join(input.dir, '.gitignore');
  try {
    writeFileSync(path, LOCK_DIR_IGNORE, { flag: 'wx' });
  } catch (error) {
    // only an extant ignore is expected; every other fault surfaces
    // note: shape-checked, not `instanceof Error` — fs errors may come from another realm
    const isExtant =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'EEXIST';
    if (!isExtant) throw error;
  }
};

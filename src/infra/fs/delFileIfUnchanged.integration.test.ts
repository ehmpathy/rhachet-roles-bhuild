import { promises as fs } from 'fs';
import { join } from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { delFileIfUnchanged } from './delFileIfUnchanged';
import { genFileExclusive } from './genFileExclusive';

const BYTES_STALE = '999999 withdraw\n';
const BYTES_FRESH = '424242 say\n';

describe('delFileIfUnchanged', () => {
  given('[case1] a file that still holds the stale bytes', () => {
    when('[t0] the reclaimer removes it', () => {
      const result = useThen('it is removed', async () => {
        const dir = genTempDir({ slug: 'del-file-if-unchanged-case1' });
        const path = join(dir, 'text.0001.out.json.claim');
        await fs.writeFile(path, BYTES_STALE);
        const isRemoved = await delFileIfUnchanged({
          path,
          bytesExpected: BYTES_STALE,
        });
        const names = await fs.readdir(dir);
        return { isRemoved, names };
      });

      then('this caller wins, and no file is left', () => {
        expect(result.isRemoved).toEqual(true);
        expect(result.names).toEqual([]);
      });
    });
  });

  given(
    '[case2] two reclaimers read one stale file; the faster one already holds a fresh one',
    () => {
      when('[t0] the slower reclaimer removes what it read', () => {
        const result = useThen('the fresh file survives', async () => {
          const dir = genTempDir({ slug: 'del-file-if-unchanged-case2' });
          const path = join(dir, 'daemon.lock');

          // both read the stale bytes; the faster one removes them and claims afresh
          await fs.writeFile(path, BYTES_STALE);
          const isFasterRemoved = await delFileIfUnchanged({
            path,
            bytesExpected: BYTES_STALE,
          });
          const isFasterClaimed = await genFileExclusive({
            path,
            bytes: BYTES_FRESH,
          });

          // the slower one now acts on the stale bytes it read before
          const isSlowerRemoved = await delFileIfUnchanged({
            path,
            bytesExpected: BYTES_STALE,
          });
          const isSlowerClaimed =
            isSlowerRemoved &&
            (await genFileExclusive({ path, bytes: '777777 say\n' }));
          const bytesAfter = await fs.readFile(path, 'utf8');
          const names = await fs.readdir(dir);
          return {
            isFasterRemoved,
            isFasterClaimed,
            isSlowerRemoved,
            isSlowerClaimed,
            bytesAfter,
            names,
          };
        });

        then('the faster reclaimer holds the slot', () => {
          expect(result.isFasterRemoved).toEqual(true);
          expect(result.isFasterClaimed).toEqual(true);
        });

        then('the slower reclaimer loses, and never claims', () => {
          expect(result.isSlowerRemoved).toEqual(false);
          expect(result.isSlowerClaimed).toEqual(false);
        });

        then('the fresh holder file is intact, with no aside left', () => {
          expect(result.bytesAfter).toEqual(BYTES_FRESH);
          expect(result.names).toEqual(['daemon.lock']);
        });
      });
    },
  );

  given('[case3] a file already gone', () => {
    when('[t0] the reclaimer removes it', () => {
      const result = useThen('it loses at once', async () => {
        const dir = genTempDir({ slug: 'del-file-if-unchanged-case3' });
        const isRemoved = await delFileIfUnchanged({
          path: join(dir, 'daemon.lock'),
          bytesExpected: BYTES_STALE,
        });
        return { isRemoved };
      });

      then('this caller loses', () => {
        expect(result.isRemoved).toEqual(false);
      });
    });
  });
});

import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genRadioLockDirIgnore } from './genRadioLockDirIgnore';

describe('genRadioLockDirIgnore', () => {
  given('[case1] a lock dir that does not exist yet', () => {
    const scene = useBeforeAll(async () => {
      const root = genTempDir({ slug: 'radio-lock-ignore-fresh' });
      return { dir: path.join(root, '.behavior', '.radio', '.locks') };
    });

    when('[t0] the ignore is findserted', () => {
      const result = useThen('it returns', async () => {
        genRadioLockDirIgnore({ dir: scene.dir });
        return {
          ignore: fs.readFileSync(path.join(scene.dir, '.gitignore'), 'utf-8'),
        };
      });

      then('the dir holds a .gitignore that ignores every file', () => {
        expect(result.ignore).toEqual('*\n');
      });
    });

    when('[t1] the ignore is findserted again', () => {
      const result = useThen('it returns', async () => {
        genRadioLockDirIgnore({ dir: scene.dir });
        return {
          files: fs.readdirSync(scene.dir).sort(),
          ignore: fs.readFileSync(path.join(scene.dir, '.gitignore'), 'utf-8'),
        };
      });

      then('the dir is unchanged: one .gitignore, same bytes', () => {
        expect(result.files).toEqual(['.gitignore']);
        expect(result.ignore).toEqual('*\n');
      });
    });
  });

  given('[case2] a lock dir whose .gitignore a human edited', () => {
    const scene = useBeforeAll(async () => {
      const dir = path.join(
        genTempDir({ slug: 'radio-lock-ignore-edited' }),
        '.locks',
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, '.gitignore'), '*\n!keep.md\n');
      return { dir };
    });

    when('[t0] the ignore is findserted', () => {
      const result = useThen('it returns', async () => {
        genRadioLockDirIgnore({ dir: scene.dir });
        return {
          ignore: fs.readFileSync(path.join(scene.dir, '.gitignore'), 'utf-8'),
        };
      });

      then('the human edit is kept, never overwritten', () => {
        expect(result.ignore).toEqual('*\n!keep.md\n');
      });
    });
  });
});

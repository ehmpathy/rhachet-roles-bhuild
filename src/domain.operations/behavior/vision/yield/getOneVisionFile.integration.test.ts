import fs from 'fs';
import { ConstraintError } from 'helpful-errors';
import path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { getOneVisionFile } from './getOneVisionFile';

const PATH_REL = '1.vision.yield.md';

/**
 * .what = a scratch dir that holds one yield, read at its real path
 * .why  = this is the lane's one i/o boundary, so each case reads the disk for real
 */
const genDirWithYield = (input: { slug: string }) => {
  const dir = genTempDir({ slug: input.slug });
  const pathAbs = path.join(dir, PATH_REL);
  fs.writeFileSync(pathAbs, '# vision\n');
  return { dir, pathAbs };
};

describe('getOneVisionFile', () => {
  given('[case1] a yield on disk', () => {
    when('[t0] it is read', () => {
      const result = useThen('it reads', async () => {
        const { pathAbs } = genDirWithYield({ slug: 'vision-file-read' });
        return getOneVisionFile({ pathAbs, pathRel: PATH_REL });
      });

      then('it returns the text as is', () => {
        expect(result.markdown).toEqual('# vision\n');
      });
    });
  });

  given('[case2] a path the caller can fix', () => {
    when('[t0] the file is absent', () => {
      const result = useThen('it refuses', async () => {
        const dir = genTempDir({ slug: 'vision-file-absent' });
        return {
          error: await getError(() =>
            getOneVisionFile({
              pathAbs: path.join(dir, PATH_REL),
              pathRel: PATH_REL,
            }),
          ),
        };
      });

      then('it is a constraint that names the file and the fix', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error.message).toContain('the vision yield is absent');
        expect(result.error.message).toContain(
          `write ${PATH_REL}, then re-arrive`,
        );
        expect(result.error.message).toContain('ENOENT');
      });
    });

    when('[t1] the path runs through a file', () => {
      const result = useThen('it refuses', async () => {
        const { pathAbs } = genDirWithYield({ slug: 'vision-file-notdir' });
        return {
          error: await getError(() =>
            getOneVisionFile({
              pathAbs: path.join(pathAbs, 'x'),
              pathRel: PATH_REL,
            }),
          ),
        };
      });

      then('it is absent, by its ENOTDIR code', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error.message).toContain('the vision yield is absent');
        expect(result.error.message).toContain('ENOTDIR');
      });
    });

    when('[t2] the path is a directory', () => {
      const result = useThen('it refuses', async () => {
        const { dir } = genDirWithYield({ slug: 'vision-file-isdir' });
        return {
          error: await getError(() =>
            getOneVisionFile({ pathAbs: dir, pathRel: PATH_REL }),
          ),
        };
      });

      then('it is a constraint: the path is not a file', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error.message).toContain('the vision path is not a file');
      });
    });

    when('[t3] the path is a symlink loop', () => {
      const result = useThen('it refuses', async () => {
        const { pathAbs } = genDirWithYield({ slug: 'vision-file-loop' });
        fs.rmSync(pathAbs);
        fs.symlinkSync(pathAbs, pathAbs);
        return {
          error: await getError(() =>
            getOneVisionFile({ pathAbs, pathRel: PATH_REL }),
          ),
        };
      });

      then('it is a constraint that names the loop', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error.message).toContain(
          'the vision path names no file it can read',
        );
      });
    });

    when('[t4] the file grants no read', () => {
      const result = useThen('it refuses', async () => {
        // chmod cannot bar root, so a root runner cannot prove this path; fail loud, never skip
        if (process.getuid?.() === 0)
          throw new ConstraintError(
            'this case needs a non-root runner: root reads a mode-000 file',
            { hint: 'run the integration suite as a non-root user' },
          );
        const { pathAbs } = genDirWithYield({ slug: 'vision-file-noread' });
        fs.chmodSync(pathAbs, 0o000);
        const error = await getError(() =>
          getOneVisionFile({ pathAbs, pathRel: PATH_REL }),
        );
        fs.chmodSync(pathAbs, 0o644);
        return { error };
      });

      then('it is a constraint that names the grant to make', () => {
        expect(result.error).toBeInstanceOf(ConstraintError);
        expect(result.error.message).toContain(
          'the vision yield is unreadable',
        );
        expect(result.error.message).toContain(
          `grant read access to ${PATH_REL}`,
        );
      });
    });
  });
});

import fs from 'fs';
import path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getOneVisionPathReal } from './getOneVisionPathReal';

describe('getOneVisionPathReal', () => {
  given('[case1] a path that exists', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'vision-path-real' });
      fs.writeFileSync(path.join(cwd, 'yield.md'), '# vision\n');
      const link = path.join(genTempDir({ slug: 'vision-path-link' }), 'r');
      fs.symlinkSync(cwd, link);
      return { cwd, link };
    });

    when('[t0] it is reached through a symlinked dir', () => {
      const placed = useThen('it places', async () =>
        getOneVisionPathReal({
          vision: path.join(scene.link, 'yield.md'),
          cwd: scene.link,
        }),
      );

      then('it lands at the real file, and cwd at its real dir', () => {
        expect(placed.cwd).toEqual(fs.realpathSync(scene.cwd));
        expect(placed.vision).toEqual(
          path.join(fs.realpathSync(scene.cwd), 'yield.md'),
        );
      });
    });
  });

  given('[case2] a path absent several dirs deep', () => {
    when('[t0] it is placed', () => {
      // the walk climbs past three absent dirs, to the real cwd, then re-appends them
      const scene = useBeforeAll(async () => ({
        cwd: genTempDir({ slug: 'vision-path-deep' }),
      }));
      const placed = useThen('it places', async () =>
        getOneVisionPathReal({
          vision: 'a/b/c/1.vision.yield.md',
          cwd: scene.cwd,
        }),
      );

      then(
        'it is the real path of the nearest extant ancestor, with the rest as given',
        () => {
          expect(placed.vision).toEqual(
            path.join(fs.realpathSync(scene.cwd), 'a/b/c/1.vision.yield.md'),
          );
        },
      );
    });

    when('[t1] its absent chain starts at the filesystem root', () => {
      // the root always exists, so the walk halts there; no loop
      const absent = '/vision-path-real-absent-top/x/1.vision.yield.md';
      const placed = useThen('it places', async () =>
        getOneVisionPathReal({ vision: absent, cwd: '/' }),
      );

      then('the walk ends at the root, and returns the path as given', () => {
        expect(placed.vision).toEqual(absent);
      });
    });
  });
});

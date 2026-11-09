import fs from 'fs';
import path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { getOneVisionPathReal } from './getOneVisionPathReal';

describe('getOneVisionPathReal', () => {
  given('[case1] a path that exists', () => {
    when('[t0] it is reached through a symlinked dir', () => {
      then('it lands at the real file, and cwd at its real dir', () => {
        const cwd = genTempDir({ slug: 'vision-path-real' });
        fs.writeFileSync(path.join(cwd, 'yield.md'), '# vision\n');
        const link = path.join(genTempDir({ slug: 'vision-path-link' }), 'r');
        fs.symlinkSync(cwd, link);
        const placed = getOneVisionPathReal({
          vision: path.join(link, 'yield.md'),
          cwd: link,
        });
        expect(placed.cwd).toEqual(fs.realpathSync(cwd));
        expect(placed.vision).toEqual(
          path.join(fs.realpathSync(cwd), 'yield.md'),
        );
      });
    });
  });

  given('[case2] a path absent several dirs deep', () => {
    when('[t0] it is placed', () => {
      then(
        'it is the real path of the nearest extant ancestor, with the rest as given',
        () => {
          // the walk climbs past three absent dirs, to the real cwd, then re-appends them
          const cwd = genTempDir({ slug: 'vision-path-deep' });
          const placed = getOneVisionPathReal({
            vision: 'a/b/c/1.vision.yield.md',
            cwd,
          });
          expect(placed.vision).toEqual(
            path.join(fs.realpathSync(cwd), 'a/b/c/1.vision.yield.md'),
          );
        },
      );
    });

    when('[t1] its absent chain starts at the filesystem root', () => {
      then('the walk ends at the root, and returns the path as given', () => {
        // the root always exists, so the walk halts there; no loop
        const absent = '/vision-path-real-absent-top/x/1.vision.yield.md';
        const placed = getOneVisionPathReal({ vision: absent, cwd: '/' });
        expect(placed.vision).toEqual(absent);
      });
    });
  });
});

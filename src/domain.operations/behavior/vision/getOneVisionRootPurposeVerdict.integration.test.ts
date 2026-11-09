import fs from 'fs';
import { ConstraintError } from 'helpful-errors';
import path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getOneVisionRootPurposeVerdict } from './getOneVisionRootPurposeVerdict';

const VISION_REL =
  '.behavior/v2026_11_08.sandpine-lesson-reminders/1.vision.yield.md';

/**
 * .what = a scratch repo dir that holds one vision yield of the given markdown
 * .why  = the verdict reads from disk, relative to cwd, as the guard's lane does
 */
const genRepoWithVision = (input: { markdown: string | null }) => {
  const cwd = genTempDir({ slug: 'vision-root-purpose-verdict' });
  if (input.markdown !== null) {
    fs.mkdirSync(path.dirname(path.join(cwd, VISION_REL)), { recursive: true });
    fs.writeFileSync(path.join(cwd, VISION_REL), input.markdown);
  }
  return { cwd };
};

const MARKDOWN_THREE_LAYERS = [
  '# vision',
  '',
  '## .the root purpose',
  '',
  '- why: surfers who book a lesson should get a reminder',
  '  - why: a surfer who forgets misses the slot',
  '    - why: an empty slot is an instructor hour never recovered',
  '',
].join('\n');

describe('getOneVisionRootPurposeVerdict', () => {
  given('[case1] a yield 3 layers deep, named relative to cwd', () => {
    when('[t0] the verdict is read', () => {
      then('it is green, and names the yield by its path from cwd', () => {
        const { cwd } = genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS });
        const verdict = getOneVisionRootPurposeVerdict(
          { vision: VISION_REL },
          { cwd },
        );
        expect(verdict.blockers).toEqual(0);
        expect(verdict.stdout).toContain(`vision: ${VISION_REL}`);
        expect(verdict.stdout).toContain('layers: 3 of 3');
      });
    });

    when('[t1] the verdict is read by an absolute path inside cwd', () => {
      then('it reads the same yield, named relative to cwd', () => {
        const { cwd } = genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS });
        const verdict = getOneVisionRootPurposeVerdict(
          { vision: path.join(cwd, VISION_REL) },
          { cwd },
        );
        expect(verdict.blockers).toEqual(0);
        expect(verdict.stdout).toContain(`vision: ${VISION_REL}`);
      });
    });

    when(
      '[t2] the verdict is read by an absolute path through a symlink to cwd',
      () => {
        then('it places inside cwd, and reads the same yield', () => {
          // a symlinked worktree: the same repo, reached by another name
          const { cwd } = genRepoWithVision({
            markdown: MARKDOWN_THREE_LAYERS,
          });
          const link = path.join(genTempDir({ slug: 'vision-link' }), 'repo');
          fs.symlinkSync(cwd, link);
          const verdict = getOneVisionRootPurposeVerdict(
            { vision: path.join(link, VISION_REL) },
            { cwd },
          );
          expect(verdict.blockers).toEqual(0);
          expect(verdict.stdout).toContain(`vision: ${VISION_REL}`);
        });
      },
    );
  });

  given('[case2] a yield with no root purpose section', () => {
    when('[t0] the verdict is read', () => {
      then('it is red, a verdict and not an error', () => {
        const { cwd } = genRepoWithVision({ markdown: '# vision\n' });
        const verdict = getOneVisionRootPurposeVerdict(
          { vision: VISION_REL },
          { cwd },
        );
        expect(verdict.blockers).toEqual(1);
        expect(verdict.stdout).toContain('section: absent');
      });
    });
  });

  given('[case3] a vision path outside cwd', () => {
    when('[t0] the path climbs above cwd', () => {
      then('it fails loud as a bad request', async () => {
        const { cwd } = genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS });
        const error = await getError(() =>
          getOneVisionRootPurposeVerdict({ vision: '../outside.md' }, { cwd }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('--vision must be inside cwd');
      });
    });

    when('[t1] the path names a peer dir whose name starts with cwd', () => {
      then(
        'it is still refused, since a name prefix is not containment',
        async () => {
          const { cwd } = genRepoWithVision({
            markdown: MARKDOWN_THREE_LAYERS,
          });
          const peer = `${cwd}-other/1.vision.yield.md`;
          const error = await getError(() =>
            getOneVisionRootPurposeVerdict({ vision: peer }, { cwd }),
          );
          expect(error).toBeInstanceOf(ConstraintError);
        },
      );
    });
  });

  given('[case4] a vision path inside cwd that holds no file', () => {
    when('[t0] the verdict is read', () => {
      then('it fails loud as a constraint, with the fix', async () => {
        const { cwd } = genRepoWithVision({ markdown: null });
        const error = await getError(() =>
          getOneVisionRootPurposeVerdict({ vision: VISION_REL }, { cwd }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('the vision yield is absent');
        expect(error.message).toContain(`write ${VISION_REL}, then re-arrive`);
      });
    });

    when('[t1] the path runs through a file, as if it were a dir', () => {
      then(
        'it fails loud as absent, never as a raw ENOTDIR stack',
        async () => {
          // realpath of `<file>/x` throws ENOTDIR; the walk up must still place it inside cwd
          const { cwd } = genRepoWithVision({
            markdown: MARKDOWN_THREE_LAYERS,
          });
          const error = await getError(() =>
            getOneVisionRootPurposeVerdict(
              { vision: `${VISION_REL}/1.vision.yield.md` },
              { cwd },
            ),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('the vision yield is absent');
        },
      );
    });
  });

  given('[case5] a vision path that names a dir, not a file', () => {
    when('[t0] the verdict is read', () => {
      then(
        'it fails loud as a constraint, never as a raw read error',
        async () => {
          const { cwd } = genRepoWithVision({
            markdown: MARKDOWN_THREE_LAYERS,
          });
          const error = await getError(() =>
            getOneVisionRootPurposeVerdict(
              { vision: path.dirname(VISION_REL) },
              { cwd },
            ),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('the vision path is not a file');
        },
      );
    });
  });

  given('[case6] a vision yield the caller cannot read', () => {
    /**
     * .what = halts a case that needs a non-root runner
     * .why  = chmod cannot bar root, so a root runner cannot prove a real permission refusal;
     *         fail loud, never skip
     */
    const assertRunnerIsNotRoot = () => {
      if (process.getuid?.() === 0)
        throw new ConstraintError(
          'this case needs a non-root runner: root reads a mode-000 file',
          { hint: 'run the integration suite as a non-root user' },
        );
    };

    // the modes this case bars are restored, so the temp dir can be cleaned
    const pathsBarred: string[] = [];
    afterEach(() => {
      pathsBarred.splice(0).forEach((barred) => fs.chmodSync(barred, 0o755));
      jest.restoreAllMocks();
    });

    when('[t0] the read is refused for permission', () => {
      then('it fails loud as a constraint, with the fix', async () => {
        assertRunnerIsNotRoot();
        const { cwd } = genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS });
        const pathOfYield = path.join(cwd, VISION_REL);
        fs.chmodSync(pathOfYield, 0o000);
        pathsBarred.push(pathOfYield);
        const error = await getError(() =>
          getOneVisionRootPurposeVerdict({ vision: VISION_REL }, { cwd }),
        );
        expect(error).toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('the vision yield is unreadable');
        expect(error.message).toContain(`grant read access to ${VISION_REL}`);
      });
    });

    when('[t2] a dir above the yield cannot be searched', () => {
      then(
        'it fails loud as unreadable, the same as the file itself',
        async () => {
          // an unsearchable ancestor fails realpath and the read alike, each with EACCES
          assertRunnerIsNotRoot();
          const { cwd } = genRepoWithVision({
            markdown: MARKDOWN_THREE_LAYERS,
          });
          const dirOfYield = path.dirname(path.join(cwd, VISION_REL));
          fs.chmodSync(dirOfYield, 0o000);
          pathsBarred.push(dirOfYield);
          const error = await getError(() =>
            getOneVisionRootPurposeVerdict({ vision: VISION_REL }, { cwd }),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain('the vision yield is unreadable');
        },
      );
    });

    when('[t1] the read fails for any other cause', () => {
      then('the error is rethrown as is, never recast', async () => {
        const { cwd } = genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS });
        /**
         * .mock = fs.readFileSync, once, to throw EIO
         * .why  = no test host can raise a real disk fault on demand, and the rethrow of a
         *         fault the caller cannot fix is the branch under test; the file and every
         *         other fs call stay real
         * .real = every other case in this suite reads the disk for real; the code-to-refusal
         *         map, EIO's null included, is clamped by asRefusalOfReadCode.test.ts
         */
        jest.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
          throw Object.assign(new Error('EIO: denied'), { code: 'EIO' });
        });
        const error = await getError(() =>
          getOneVisionRootPurposeVerdict({ vision: VISION_REL }, { cwd }),
        );
        expect(error).not.toBeInstanceOf(ConstraintError);
        expect(error.message).toContain('EIO: denied');
      });
    });
  });

  given('[case7] a vision path that is a symlink loop', () => {
    when('[t0] the verdict is read', () => {
      then(
        'it fails loud as a constraint with the fix, never a raw ELOOP',
        async () => {
          // a real loop: the yield is a symlink to itself, so realpath and the read each see ELOOP
          const { cwd } = genRepoWithVision({
            markdown: MARKDOWN_THREE_LAYERS,
          });
          const pathOfYield = path.join(cwd, VISION_REL);
          fs.rmSync(pathOfYield);
          fs.symlinkSync(pathOfYield, pathOfYield);
          const error = await getError(() =>
            getOneVisionRootPurposeVerdict({ vision: VISION_REL }, { cwd }),
          );
          expect(error).toBeInstanceOf(ConstraintError);
          expect(error.message).toContain(
            'the vision path names no file it can read',
          );
          expect(error.message).toContain('not a symlink loop');
        },
      );
    });
  });
});

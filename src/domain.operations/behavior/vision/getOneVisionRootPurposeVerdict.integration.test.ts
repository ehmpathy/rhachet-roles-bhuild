import fs from 'fs';
import { ConstraintError } from 'helpful-errors';
import path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

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

/**
 * .what = the error a procedure throws, held in an object
 * .why  = useThen shares its result through a proxy, which hides an Error's prototype;
 *         a held error stays the real instance, so `toBeInstanceOf` reads its class
 */
const getRefusal = async (procedure: () => unknown) => ({
  error: await getError(procedure),
});

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
    const scene = useBeforeAll(async () =>
      genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS }),
    );

    when('[t0] the verdict is read', () => {
      const verdict = useThen('it reads', async () =>
        getOneVisionRootPurposeVerdict(
          { vision: VISION_REL },
          { cwd: scene.cwd },
        ),
      );

      then('it is green, and names the yield by its path from cwd', () => {
        expect(verdict.blockers).toEqual(0);
        expect(verdict.stdout).toContain(`vision: ${VISION_REL}`);
        expect(verdict.stdout).toContain('layers: 3 of 3');
      });
    });

    when('[t1] the verdict is read by an absolute path inside cwd', () => {
      const verdict = useThen('it reads', async () =>
        getOneVisionRootPurposeVerdict(
          { vision: path.join(scene.cwd, VISION_REL) },
          { cwd: scene.cwd },
        ),
      );

      then('it reads the same yield, named relative to cwd', () => {
        expect(verdict.blockers).toEqual(0);
        expect(verdict.stdout).toContain(`vision: ${VISION_REL}`);
      });
    });

    when(
      '[t2] the verdict is read by an absolute path through a symlink to cwd',
      () => {
        // a symlinked worktree: the same repo, reached by another name
        const link = useBeforeAll(async () => {
          const pathOfLink = path.join(
            genTempDir({ slug: 'vision-link' }),
            'repo',
          );
          fs.symlinkSync(scene.cwd, pathOfLink);
          return { path: pathOfLink };
        });
        const verdict = useThen('it reads', async () =>
          getOneVisionRootPurposeVerdict(
            { vision: path.join(link.path, VISION_REL) },
            { cwd: scene.cwd },
          ),
        );

        then('it places inside cwd, and reads the same yield', () => {
          expect(verdict.blockers).toEqual(0);
          expect(verdict.stdout).toContain(`vision: ${VISION_REL}`);
        });
      },
    );
  });

  given('[case2] a yield with no root purpose section', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithVision({ markdown: '# vision\n' }),
    );

    when('[t0] the verdict is read', () => {
      const verdict = useThen('it reads', async () =>
        getOneVisionRootPurposeVerdict(
          { vision: VISION_REL },
          { cwd: scene.cwd },
        ),
      );

      then('it is red, a verdict and not an error', () => {
        expect(verdict.blockers).toEqual(1);
        expect(verdict.stdout).toContain('section: absent');
      });
    });
  });

  given('[case3] a vision path outside cwd', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS }),
    );

    when('[t0] the path climbs above cwd', () => {
      const refusal = useThen('it is refused', async () =>
        getRefusal(() =>
          getOneVisionRootPurposeVerdict(
            { vision: '../outside.md' },
            { cwd: scene.cwd },
          ),
        ),
      );

      then('it fails loud as a bad request', () => {
        expect(refusal.error).toBeInstanceOf(ConstraintError);
        expect(refusal.error.message).toContain('--vision must be inside cwd');
      });
    });

    when('[t1] the path names a peer dir whose name starts with cwd', () => {
      const refusal = useThen('it is refused', async () =>
        getRefusal(() =>
          getOneVisionRootPurposeVerdict(
            { vision: `${scene.cwd}-other/1.vision.yield.md` },
            { cwd: scene.cwd },
          ),
        ),
      );

      then(
        'it is still refused, since a name prefix is not containment',
        () => {
          expect(refusal.error).toBeInstanceOf(ConstraintError);
        },
      );
    });
  });

  given('[case4] a vision path inside cwd that holds no file', () => {
    when('[t0] the verdict is read', () => {
      const scene = useBeforeAll(async () =>
        genRepoWithVision({ markdown: null }),
      );
      const refusal = useThen('it is refused', async () =>
        getRefusal(() =>
          getOneVisionRootPurposeVerdict(
            { vision: VISION_REL },
            { cwd: scene.cwd },
          ),
        ),
      );

      then('it fails loud as a constraint, with the fix', () => {
        expect(refusal.error).toBeInstanceOf(ConstraintError);
        expect(refusal.error.message).toContain('the vision yield is absent');
        expect(refusal.error.message).toContain(
          `write ${VISION_REL}, then re-arrive`,
        );
      });
    });

    when('[t1] the path runs through a file, as if it were a dir', () => {
      // realpath of `<file>/x` throws ENOTDIR; the walk up must still place it inside cwd
      const scene = useBeforeAll(async () =>
        genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS }),
      );
      const refusal = useThen('it is refused', async () =>
        getRefusal(() =>
          getOneVisionRootPurposeVerdict(
            { vision: `${VISION_REL}/1.vision.yield.md` },
            { cwd: scene.cwd },
          ),
        ),
      );

      then(
        'it fails loud with a fix it can follow, never a raw ENOTDIR stack',
        () => {
          expect(refusal.error).toBeInstanceOf(ConstraintError);
          expect(refusal.error.message).toContain(
            'the vision path runs through a file',
          );
          // a path through a file cannot be written, so the fix names the yield instead
          expect(refusal.error.message).not.toContain('then re-arrive');
          expect(refusal.error.message).toContain(
            "name the yield itself: --vision '<route>/1.vision.yield.md'",
          );
        },
      );
    });
  });

  given('[case5] a vision path that names a dir, not a file', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS }),
    );

    when('[t0] the verdict is read', () => {
      const refusal = useThen('it is refused', async () =>
        getRefusal(() =>
          getOneVisionRootPurposeVerdict(
            { vision: path.dirname(VISION_REL) },
            { cwd: scene.cwd },
          ),
        ),
      );

      then('it fails loud as a constraint, never as a raw read error', () => {
        expect(refusal.error).toBeInstanceOf(ConstraintError);
        expect(refusal.error.message).toContain(
          'the vision path is not a file',
        );
      });
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
    afterAll(() => {
      pathsBarred.splice(0).forEach((barred) => fs.chmodSync(barred, 0o755));
      jest.restoreAllMocks();
    });

    when('[t0] the read is refused for permission', () => {
      const scene = useBeforeAll(async () => {
        assertRunnerIsNotRoot();
        const { cwd } = genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS });
        const pathOfYield = path.join(cwd, VISION_REL);
        fs.chmodSync(pathOfYield, 0o000);
        pathsBarred.push(pathOfYield);
        return { cwd };
      });
      const refusal = useThen('it is refused', async () =>
        getRefusal(() =>
          getOneVisionRootPurposeVerdict(
            { vision: VISION_REL },
            { cwd: scene.cwd },
          ),
        ),
      );

      then('it fails loud as a constraint, with the fix', () => {
        expect(refusal.error).toBeInstanceOf(ConstraintError);
        expect(refusal.error.message).toContain(
          'the vision yield is unreadable',
        );
        expect(refusal.error.message).toContain(
          `grant read access to ${VISION_REL}`,
        );
      });
    });

    when('[t1] the read fails for any other cause', () => {
      const scene = useBeforeAll(async () =>
        genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS }),
      );
      const refusal = useThen('it is rethrown', async () => {
        /**
         * .mock = fs.readFileSync, once, to throw EIO
         * .why  = no test host can raise a real disk fault on demand, and the rethrow of a
         *         fault the caller cannot fix is the branch under test; the file and every
         *         other fs call stay real. the fault is part of the event, so it is armed
         *         here, adjacent to the read it faults
         * .real = every other case in this suite reads the disk for real; the code-to-refusal
         *         map, EIO's null included, is clamped by asRefusalOfReadCode.test.ts
         */
        jest.spyOn(fs, 'readFileSync').mockImplementationOnce(() => {
          throw Object.assign(new Error('EIO: denied'), { code: 'EIO' });
        });
        return getRefusal(() =>
          getOneVisionRootPurposeVerdict(
            { vision: VISION_REL },
            { cwd: scene.cwd },
          ),
        );
      });

      then('the error is rethrown as is, never recast', () => {
        expect(refusal.error).not.toBeInstanceOf(ConstraintError);
        expect(refusal.error.message).toContain('EIO: denied');
      });
    });

    when('[t2] a dir above the yield cannot be searched', () => {
      // an unsearchable ancestor fails realpath and the read alike, each with EACCES
      const scene = useBeforeAll(async () => {
        assertRunnerIsNotRoot();
        const { cwd } = genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS });
        const dirOfYield = path.dirname(path.join(cwd, VISION_REL));
        fs.chmodSync(dirOfYield, 0o000);
        pathsBarred.push(dirOfYield);
        return { cwd };
      });
      const refusal = useThen('it is refused', async () =>
        getRefusal(() =>
          getOneVisionRootPurposeVerdict(
            { vision: VISION_REL },
            { cwd: scene.cwd },
          ),
        ),
      );

      then('it fails loud as unreadable, the same as the file itself', () => {
        expect(refusal.error).toBeInstanceOf(ConstraintError);
        expect(refusal.error.message).toContain(
          'the vision yield is unreadable',
        );
      });
    });
  });

  given('[case7] a vision path that is a symlink loop', () => {
    // a real loop: the yield is a symlink to itself, so realpath and the read each see ELOOP
    const scene = useBeforeAll(async () => {
      const { cwd } = genRepoWithVision({ markdown: MARKDOWN_THREE_LAYERS });
      const pathOfYield = path.join(cwd, VISION_REL);
      fs.rmSync(pathOfYield);
      fs.symlinkSync(pathOfYield, pathOfYield);
      return { cwd };
    });

    when('[t0] the verdict is read', () => {
      const refusal = useThen('it is refused', async () =>
        getRefusal(() =>
          getOneVisionRootPurposeVerdict(
            { vision: VISION_REL },
            { cwd: scene.cwd },
          ),
        ),
      );

      then(
        'it fails loud as a constraint with the fix, never a raw ELOOP',
        () => {
          expect(refusal.error).toBeInstanceOf(ConstraintError);
          expect(refusal.error.message).toContain(
            'the vision path is a symlink loop',
          );
          expect(refusal.error.message).toContain(
            'point the symlink at the real yield',
          );
        },
      );
    });
  });
});

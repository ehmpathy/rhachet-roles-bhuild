import fs from 'fs';
import { ConstraintError } from 'helpful-errors';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import {
  genConsumerRepo,
  runRhachetSkill,
  sanitizeOutput,
} from '../.test/infra';

const ROUTE_REL = '.behavior/v2026_11_08.sandpine-lesson-reminders';
const VISION_REL = `${ROUTE_REL}/1.vision.yield.md`;

/**
 * .what = a consumer repo whose route holds one vision yield of the given markdown
 * .why  = the skill reads the yield relative to cwd, as the 1.vision guard's depth lane does
 */
const genRepoWithVision = (input: { markdown: string | null }) => {
  const { repoDir } = genConsumerRepo({ prefix: 'review-vision-root-purpose' });
  if (input.markdown !== null) {
    fs.mkdirSync(path.join(repoDir, ROUTE_REL), { recursive: true });
    fs.writeFileSync(path.join(repoDir, VISION_REL), input.markdown);
  }
  return { repoDir };
};

/**
 * .what = runs the skill as a consumer would, via rhachet dispatch
 * .why  = proves the shell entry, the package export, and the cli together
 */
const runReviewVisionRootPurpose = (input: {
  repoDir: string;
  args: string;
}) =>
  runRhachetSkill({
    repo: 'bhuild',
    skill: 'review.vision.root-purpose',
    args: input.args,
    repoDir: input.repoDir,
  });

/**
 * .what = a refusal's full output, ansi stripped, with the temp repo dir masked
 * .why  = each run mints a fresh temp dir (its name holds a clock time), and the cli
 *         names it by its realpath; the mask covers both forms so the snapshot is stable
 *         and holds no timestamp (rule.forbid.timestamps-in-tracked-files)
 */
const asOutputMasked = (input: {
  result: { output: string };
  repoDir: string;
}): string =>
  [input.repoDir, fs.realpathSync(input.repoDir)].reduce(
    (output, dir) => output.split(dir).join('$REPO_DIR'),
    sanitizeOutput(input.result.output),
  );

/**
 * .what = the markdown of a vision whose root purpose holds the given layers
 * .why  = each case varies only the depth; the rest of the yield stays fixed
 */
const asVisionMarkdown = (input: { layers: string[] }): string =>
  [
    '# vision: lesson reminders',
    '',
    '## .the root purpose',
    '',
    ...input.layers.map((layer, index) => `${'  '.repeat(index)}- why: ${layer}`),
    '',
    '## the outcome world',
    '',
    'a surfer gets a reminder the day before a lesson.',
    '',
  ].join('\n');

const LAYERS_OF_MOTIVE = [
  'surfers who book a lesson should get a reminder the day before',
  'a surfer who forgets misses the slot, and the instructor waits on an empty beach',
  'an empty slot is an instructor hour the school pays for and never recovers',
];

describe('skill.review.vision.root-purpose', () => {
  given('[case1] a vision whose root purpose is 3 layers deep', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithVision({
        markdown: asVisionMarkdown({ layers: LAYERS_OF_MOTIVE }),
      }),
    );

    when('[t0] the skill reads it', () => {
      const result = useBeforeAll(async () =>
        runReviewVisionRootPurpose({
          repoDir: scene.repoDir,
          args: `--vision '${VISION_REL}'`,
        }),
      );

      then('it exits 0 with 0 blockers and 0 nitpicks', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain('layers: 3 of 3');
        expect(result.stdout).toContain('0 blockers');
        expect(result.stdout).toContain('0 nitpicks');
      });

      then('the stdout matches the snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] a vision whose root purpose stops at 2 layers', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithVision({
        markdown: asVisionMarkdown({ layers: LAYERS_OF_MOTIVE.slice(0, 2) }),
      }),
    );

    when('[t0] the skill reads it', () => {
      const result = useBeforeAll(async () =>
        runReviewVisionRootPurpose({
          repoDir: scene.repoDir,
          args: `--vision '${VISION_REL}'`,
        }),
      );

      then('it exits 0, a verdict, with 1 blocker that names the fix', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain('layers: 2 of 3');
        expect(result.stdout).toContain('1 blocker');
        expect(result.stdout).toContain('fix: ask why of the deepest layer');
      });

      then('the stdout matches the snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case3] a vision with no root purpose section', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithVision({ markdown: '# vision\n\n## the outcome world\n' }),
    );

    when('[t0] the skill reads it', () => {
      const result = useBeforeAll(async () =>
        runReviewVisionRootPurpose({
          repoDir: scene.repoDir,
          args: `--vision '${VISION_REL}'`,
        }),
      );

      then('it exits 0 with 1 blocker: the section is absent', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain('section: absent');
        expect(result.stdout).toContain('1 blocker');
      });

      then('the stdout matches the snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] a vision whose root purpose is a shape the depth lane refuses', () => {
    const SHAPES: { slug: string; body: string[]; expect: string[] }[] = [
      {
        slug: 'the scaffold left verbatim',
        body: [
          '- why: <the surface motive — why the wisher asked>',
          '  - why: <the motive beneath it>',
          '    - why: <the root motive — the one that no longer shifts>',
        ],
        expect: ['layers: 0 of 3', 'no motive in 3 layers', '1 blocker'],
      },
      {
        slug: 'three whys at one indent',
        body: LAYERS_OF_MOTIVE.map((layer) => `- why: ${layer}`),
        expect: ['layers: 1 of 3', 'fix: nest each `- why:`', '1 blocker'],
      },
      {
        slug: 'whys in a numbered list',
        body: LAYERS_OF_MOTIVE.map(
          (layer, index) => `${index + 1}. why ${layer}`,
        ),
        expect: [
          'layers: 0 of 3',
          'fix: write the first `- why:` bullet under the header',
          '1 blocker',
          '1 nitpick',
        ],
      },
    ];

    SHAPES.forEach((shape) =>
      when(`[t0] the root purpose is ${shape.slug}`, () => {
        const result = useBeforeAll(async () => {
          const { repoDir } = genRepoWithVision({
            markdown: [
              '# vision: lesson reminders',
              '',
              '## .the root purpose',
              '',
              ...shape.body,
              '',
              '## the outcome world',
              '',
            ].join('\n'),
          });
          return runReviewVisionRootPurpose({
            repoDir,
            args: `--vision '${VISION_REL}'`,
          });
        });

        then('it exits 0, a verdict, red, with the fix for that shape', () => {
          expect(result.exitCode).toEqual(0);
          shape.expect.forEach((text) => expect(result.stdout).toContain(text));
        });

        then('the stdout matches the snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      }),
    );
  });

  given('[case7] a 3-layer root purpose beside whys in another form', () => {
    const scene = useBeforeAll(async () =>
      genRepoWithVision({
        markdown: [
          '# vision: lesson reminders',
          '',
          '## .the root purpose',
          '',
          ...LAYERS_OF_MOTIVE.map(
            (layer, index) => `${'  '.repeat(index)}- why: ${layer}`,
          ),
          '* why: a reminder also cuts the calls to the front desk',
          '1. why the school can schedule fewer instructors per tide',
          '',
          '## the outcome world',
          '',
        ].join('\n'),
      }),
    );

    when('[t0] the skill reads it', () => {
      const result = useBeforeAll(async () =>
        runReviewVisionRootPurpose({
          repoDir: scene.repoDir,
          args: `--vision '${VISION_REL}'`,
        }),
      );

      then('it exits 0, green, yet names the unread whys as 1 nitpick', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain('layers: 3 of 3');
        expect(result.stdout).toContain('0 blockers');
        expect(result.stdout).toContain('1 nitpick');
        expect(result.stdout).toContain(
          '[nitpick][better] the root purpose holds 2 whys in a form the lane does not read',
        );
        expect(result.stdout).toContain('fix: rewrite each as a `- why:` bullet');
      });

      then('the stdout matches the snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case8] a yield whose shape the parser reads apart from a plain layer list', () => {
    const asYield = (input: { body: string[] }): string =>
      ['# vision: lesson reminders', '', ...input.body, '', '## the outcome world', ''].join(
        '\n',
      );
    const asLayers = (input: { layers: string[] }): string[] =>
      input.layers.map((layer, index) => `${'  '.repeat(index)}- why: ${layer}`);

    const SHAPES: { slug: string; markdown: string; expect: string[] }[] = [
      {
        slug: 'a section of prose, with no layer at all',
        markdown: asYield({
          body: [
            '## .the root purpose',
            '',
            'surfers forget their lessons, and the school loses the slot.',
          ],
        }),
        expect: [
          'layers: 0 of 3',
          'fix: write the first `- why:` bullet under the header',
          '1 blocker',
        ],
      },
      {
        slug: 'a header and its layers only inside a code fence',
        markdown: asYield({
          body: [
            '```md',
            '## .the root purpose',
            '',
            ...asLayers({ layers: LAYERS_OF_MOTIVE }),
            '```',
          ],
        }),
        expect: ['section: absent', '1 blocker'],
      },
      {
        slug: 'a near-miss header that ends in a colon',
        markdown: asYield({
          body: ['## .the root purpose:', '', ...asLayers({ layers: LAYERS_OF_MOTIVE })],
        }),
        expect: ['section: absent', '1 blocker'],
      },
      {
        slug: 'a near-miss header at h3',
        markdown: asYield({
          body: ['### .the root purpose', '', ...asLayers({ layers: LAYERS_OF_MOTIVE })],
        }),
        expect: ['section: absent', '1 blocker'],
      },
      {
        slug: 'one scaffold layer beneath two real layers',
        markdown: asYield({
          body: [
            '## .the root purpose',
            '',
            ...asLayers({
              layers: [
                ...LAYERS_OF_MOTIVE.slice(0, 2),
                '<the root motive — the one that no longer shifts>',
              ],
            }),
          ],
        }),
        expect: [
          'layers: 2 of 3',
          'holds no motive in 1 layer',
          'fix: fill the scaffold layers first',
          '2 blockers',
        ],
      },
      {
        slug: 'two layers beside a why in another form',
        markdown: asYield({
          body: [
            '## .the root purpose',
            '',
            ...asLayers({ layers: LAYERS_OF_MOTIVE.slice(0, 2) }),
            '* why: a reminder also cuts the calls to the front desk',
          ],
        }),
        expect: [
          'layers: 2 of 3',
          '[nitpick][better] the root purpose holds 1 why in a form the lane does not read',
          '1 blocker',
          '1 nitpick',
        ],
      },
      {
        slug: 'four layers, past the floor',
        markdown: asYield({
          body: [
            '## .the root purpose',
            '',
            ...asLayers({
              layers: [
                ...LAYERS_OF_MOTIVE,
                'a school that loses instructor hours cannot keep its instructors through the winter',
              ],
            }),
          ],
        }),
        expect: ['layers: 4 of 3', '0 blockers', '0 nitpicks'],
      },
    ];

    SHAPES.forEach((shape) =>
      when(`[t0] the yield is ${shape.slug}`, () => {
        const result = useBeforeAll(async () => {
          const { repoDir } = genRepoWithVision({ markdown: shape.markdown });
          return runReviewVisionRootPurpose({
            repoDir,
            args: `--vision '${VISION_REL}'`,
          });
        });

        then('it exits 0, a verdict, with the counts and fix for that shape', () => {
          expect(result.exitCode).toEqual(0);
          shape.expect.forEach((text) => expect(result.stdout).toContain(text));
        });

        then('the stdout matches the snapshot', () => {
          expect(result.stdout).toMatchSnapshot();
        });
      }),
    );
  });

  given('[case5] a human who asks for help', () => {
    const scene = useBeforeAll(async () => genRepoWithVision({ markdown: null }));

    when('[t0] --help is passed', () => {
      const result = useBeforeAll(async () =>
        runReviewVisionRootPurpose({ repoDir: scene.repoDir, args: '--help' }),
      );

      then('it exits 0 with usage, inputs, an example, and exit codes', () => {
        expect(result.exitCode).toEqual(0);
        expect(result.stdout).toContain(
          'usage: rhx review.vision.root-purpose --vision <path>',
        );
        expect(result.stdout).toContain('--vision (required)');
        expect(result.stdout).toContain('example');
        expect(result.stdout).toContain('exit codes');
      });

      then('the usage matches the snapshot', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case4] a call the skill must refuse', () => {
    const scene = useBeforeAll(async () => genRepoWithVision({ markdown: null }));

    when('[t0] --vision is absent', () => {
      const result = useBeforeAll(async () =>
        runReviewVisionRootPurpose({ repoDir: scene.repoDir, args: '' }),
      );

      then('it exits 2 and names the run line', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain('--vision is required');
        expect(result.output).toContain('rhx review.vision.root-purpose --vision');
      });

      then('the refusal matches the snapshot', () => {
        expect(asOutputMasked({ result, repoDir: scene.repoDir })).toMatchSnapshot();
      });
    });

    when('[t1] --vision names a yield that does not exist', () => {
      const result = useBeforeAll(async () =>
        runReviewVisionRootPurpose({
          repoDir: scene.repoDir,
          args: `--vision '${VISION_REL}'`,
        }),
      );

      then('it exits 2 and names the fix', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain('the vision yield is absent');
        expect(result.output).toContain(`write ${VISION_REL}, then re-arrive`);
      });

      then('the refusal matches the snapshot', () => {
        expect(asOutputMasked({ result, repoDir: scene.repoDir })).toMatchSnapshot();
      });
    });

    when('[t2] --vision climbs out of cwd', () => {
      const result = useBeforeAll(async () =>
        runReviewVisionRootPurpose({
          repoDir: scene.repoDir,
          args: "--vision '../outside/1.vision.yield.md'",
        }),
      );

      then('it exits 2', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain('--vision must be inside cwd');
      });

      then('the masked refusal names the cwd but holds no clock time', () => {
        const masked = asOutputMasked({ result, repoDir: scene.repoDir });
        expect(masked).toContain('"cwd": "$REPO_DIR"');
        expect(masked).not.toMatch(/T\d{2}[-:]\d{2}[-:]\d{2}/);
      });

      then('the refusal matches the snapshot', () => {
        expect(asOutputMasked({ result, repoDir: scene.repoDir })).toMatchSnapshot();
      });
    });

    when('[t4] --vision names a yield the caller cannot read', () => {
      const result = useBeforeAll(async () => {
        // chmod cannot bar root, so a root runner cannot prove this path; fail loud, never skip
        if (process.getuid?.() === 0)
          throw new ConstraintError(
            'this case needs a non-root runner: root reads a mode-000 file',
            { hint: 'run the acceptance suite as a non-root user' },
          );
        const { repoDir } = genRepoWithVision({
          markdown: asVisionMarkdown({ layers: LAYERS_OF_MOTIVE }),
        });
        fs.chmodSync(path.join(repoDir, VISION_REL), 0o000);
        return {
          repoDir,
          run: runReviewVisionRootPurpose({
            repoDir,
            args: `--vision '${VISION_REL}'`,
          }),
        };
      });

      then('it exits 2 and names the fix', () => {
        expect(result.run.exitCode).toEqual(2);
        expect(result.run.output).toContain('the vision yield is unreadable');
        expect(result.run.output).toContain(
          `grant read access to ${VISION_REL}`,
        );
      });

      then('the refusal matches the snapshot', () => {
        expect(
          asOutputMasked({ result: result.run, repoDir: result.repoDir }),
        ).toMatchSnapshot();
      });
    });

    when('[t3] --vision names the route dir, not the yield', () => {
      const result = useBeforeAll(async () => {
        fs.mkdirSync(path.join(scene.repoDir, ROUTE_REL), { recursive: true });
        return runReviewVisionRootPurpose({
          repoDir: scene.repoDir,
          args: `--vision '${ROUTE_REL}'`,
        });
      });

      then('it exits 2 and names the yield to pass instead', () => {
        expect(result.exitCode).toEqual(2);
        expect(result.output).toContain('the vision path is not a file');
      });

      then('the refusal matches the snapshot', () => {
        expect(asOutputMasked({ result, repoDir: scene.repoDir })).toMatchSnapshot();
      });
    });
  });
});

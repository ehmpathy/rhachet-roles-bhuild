import fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import os from 'os';
import path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { initBehaviorDir } from './initBehaviorDir';

/**
 * .what = the text of one yaml list item in a guard template, from its slug line to the next
 *         line at the item's own indent or less (the next item, or the next key of the guard)
 * .why = a clamp reads one lane or self-review; an absent slug fails with the template named
 */
const getBlockOfSlug = (input: {
  template: string;
  name: string;
  slug: string;
}): string => {
  const lines = input.template.split('\n');
  const at = lines.findIndex((line) => line.trim() === `- slug: ${input.slug}`);
  if (at === -1)
    throw new MalfunctionError(
      'guard template lacks the slug this clamp reads',
      {
        template: input.name,
        slug: input.slug,
        hint: 'restore the slug in the template, or update this clamp',
      },
    );
  const getIndent = (line: string): number =>
    line.length - line.trimStart().length;
  const indentItem = getIndent(lines[at]!);
  const end = lines.findIndex(
    (line, index) =>
      index > at && line.trim() !== '' && getIndent(line) <= indentItem,
  );
  return lines
    .slice(at, end === -1 ? undefined : end)
    .join('\n')
    .trim();
};

/**
 * .what = the `run:` line of one peer lane in a guard template
 * .why = the lane clamp reads its --rules and --refs; an absent line fails with the lane named
 */
const getRunOfLane = (input: {
  template: string;
  name: string;
  slug: string;
}): string => {
  const run = getBlockOfSlug(input)
    .split('\n')
    .find((line) => line.trim().startsWith('run: '));
  if (!run)
    throw new MalfunctionError('guard lane lacks a run line', {
      template: input.name,
      slug: input.slug,
      hint: 'restore the lane run line, or update this clamp',
    });
  return run;
};

describe('initBehaviorDir.integration', () => {
  let tempDir: string;
  let behaviorDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'initBehaviorDir-guard-test-'),
    );
    behaviorDir = path.join(tempDir, '.behavior', 'v2025_01_01.test-feature');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  given('[case1] guard level is light (default)', () => {
    when('[t0] initBehaviorDir is called without guard arg', () => {
      // init once into a dir of its own; every then below reads that one result
      const scene = useBeforeAll(async () => {
        const tempDirScene = fs.mkdtempSync(
          path.join(os.tmpdir(), 'initBehaviorDir-light-default-'),
        );
        const behaviorDirScene = path.join(
          tempDirScene,
          '.behavior',
          'v2025_01_01.test-feature',
        );
        const result = initBehaviorDir({
          behaviorDir: behaviorDirScene,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });
        return { tempDir: tempDirScene, behaviorDir: behaviorDirScene, result };
      });
      afterAll(() =>
        fs.rmSync(scene.tempDir, { recursive: true, force: true }),
      );

      then('creates light guard files for vision and blueprint', () => {
        // verify guard files created (without .light suffix)
        expect(scene.result.created).toContain('1.vision.guard');
        expect(scene.result.created).toContain('3.3.1.blueprint.product.guard');

        // verify files exist on disk
        expect(
          fs.existsSync(path.join(scene.behaviorDir, '1.vision.guard')),
        ).toBe(true);
        expect(
          fs.existsSync(
            path.join(scene.behaviorDir, '3.3.1.blueprint.product.guard'),
          ),
        ).toBe(true);

        // verify no .light or .heavy suffix files created
        expect(scene.result.created).not.toContain('1.vision.guard.light');
        expect(scene.result.created).not.toContain('1.vision.guard.heavy');
      });

      then('blueprint guard has light self-reviews (6 reviews)', () => {
        const blueprintGuard = fs.readFileSync(
          path.join(scene.behaviorDir, '3.3.1.blueprint.product.guard'),
          'utf-8',
        );

        // light has: deletables, assumptions, coverage/adherance
        expect(blueprintGuard).toContain('has-questioned-deletables');
        expect(blueprintGuard).toContain('has-questioned-assumptions');
        expect(blueprintGuard).toContain('has-behavior-declaration-coverage');
        expect(blueprintGuard).toContain('has-behavior-declaration-adherance');
        expect(blueprintGuard).toContain('has-role-standards-adherance');
        expect(blueprintGuard).toContain('has-role-standards-coverage');

        // light does NOT have: 5whys, premortem, inverse, devils-advocate
        expect(blueprintGuard).not.toContain('has-questioned-5whys');
        expect(blueprintGuard).not.toContain('has-questioned-premortem');
        expect(blueprintGuard).not.toContain('has-questioned-inverse');
        expect(blueprintGuard).not.toContain('has-questioned-devils-advocate');

        // the wisher-how peer lane grades the criteria yield, since light has no criteria guard
        expect(blueprintGuard).toContain('slug: wisher-how');
        expect(blueprintGuard).toContain("--paths-with '$route/2.*.yield.md'");
      });

      then(
        'vision, criteria, and blueprint stones point the writer at the wisher-how rule',
        () => {
          const getStoneText = (stone: string): string =>
            fs.readFileSync(path.join(scene.behaviorDir, stone), 'utf-8');
          const visionStone = getStoneText('1.vision.stone');
          const criteriaStone = getStoneText('2.1.criteria.blackbox.stone');
          const criteriaBlueprintStone = getStoneText(
            '2.3.criteria.blueprint.stone',
          );
          const blueprintStone = getStoneText('3.3.1.blueprint.product.stone');

          // the execution stones, read from their templates: each route size writes one of them
          const executionStones = [
            '5.1.execution.from_vision.stone',
            '5.1.execution.phase0_to_phaseN.stone',
          ].map((stone) =>
            fs.readFileSync(path.join(__dirname, 'templates', stone), 'utf-8'),
          );

          // each stone names the rule at the moment the writer reads the wish
          [
            visionStone,
            criteriaStone,
            criteriaBlueprintStone,
            blueprintStone,
            ...executionStones,
          ].forEach((stone) =>
            expect(stone).toContain('(rule.forbid.trust-of-wisher-how)'),
          );
          expect(criteriaStone).toContain('strike any prior tool or poc');

          // the vision stone names the table that each later stone defers to
          [
            visionStone,
            criteriaBlueprintStone,
            blueprintStone,
            ...executionStones,
          ].forEach((stone) =>
            expect(stone).toContain("`## .the wisher's how`"),
          );

          // the vision stone outlines the table, with its three verdicts and the open-question link
          expect(visionStone).toContain("## .the wisher's how\n");
          expect(visionStone).toContain('keep, drop, or open');
          expect(visionStone).toContain('open questions below as `[wisher]`');
          expect(criteriaBlueprintStone).toContain('keep, drop, or open');

          // the stone heads the writer reads, whole, for review
          expect({
            vision: visionStone.split('\n---\n')[0],
            criteria: criteriaStone.split('\n---\n')[0],
            criteriaBlueprint: criteriaBlueprintStone.split('\n---\n')[0],
            blueprint: blueprintStone.split('\n---\n')[0],
            executionFromVision: executionStones[0]!.split('\n---\n')[0],
            executionPhase0ToPhaseN: executionStones[1]!.split('\n---\n')[0],
          }).toMatchSnapshot();

          // with no vision, the 2.3 and blueprint stones record the verdicts themselves
          [criteriaBlueprintStone, blueprintStone].forEach((stone) =>
            expect(stone).toContain('with no vision'),
          );

          // the later stones cite the vision yield, never the retired path
          [
            criteriaStone,
            criteriaBlueprintStone,
            blueprintStone,
            ...executionStones,
          ].forEach((stone) => {
            expect(stone).toContain('1.vision.yield.md');
            expect(stone).not.toContain('1.vision.md');
          });
        },
      );

      then('no template cites the retired vision path', () => {
        // the vision stone emits 1.vision.yield.md; a cite of 1.vision.md points a writer at no file
        const stale = fs
          .readdirSync(path.join(__dirname, 'templates'), {
            recursive: true,
            withFileTypes: true,
          })
          .filter((entry) => entry.isFile())
          .map((entry) => path.join(entry.parentPath, entry.name))
          .filter((file) =>
            fs.readFileSync(file, 'utf-8').includes('1.vision.md'),
          );
        expect(stale).toEqual([]);
      });

      then(
        'every wisher-how lane loads the rule, its argument, and its worked case',
        () => {
          // .what = the brief paths a lane names, mapped from the linked role to its source
          const asSourcePath = (input: { linked: string }): string =>
            input.linked.replace(
              '.agent/repo=bhuild/role=behaver/briefs/',
              path.join(__dirname, '../../../domain.roles/behaver/briefs/'),
            );
          const lanes = (['light', 'heavy'] as const).flatMap((guard) =>
            ['1.vision.guard', '3.3.1.blueprint.product.guard'].map((name) => {
              const template = fs.readFileSync(
                path.join(__dirname, 'templates', `${name}.${guard}`),
                'utf-8',
              );
              const run = getRunOfLane({
                template,
                name: `${name}.${guard}`,
                slug: 'wisher-how',
              });
              return {
                rules: [...run.matchAll(/--rules '([^']+)'/g)].map(
                  (m) => m[1]!,
                ),
                refs: [...run.matchAll(/--refs '(\.agent[^']+)'/g)].map(
                  (m) => m[1]!,
                ),
              };
            }),
          );
          expect(lanes).toHaveLength(4);
          lanes.forEach((lane) => {
            expect(lane.rules.map((p) => path.basename(p))).toEqual([
              'rule.forbid.trust-of-wisher-how.md',
            ]);
            expect(lane.refs.map((p) => path.basename(p))).toEqual([
              'rule.forbid.trust-of-wisher-how.reason.md',
              'rule.forbid.trust-of-wisher-how.example=rhachet-760.md',
            ]);
            [...lane.rules, ...lane.refs].forEach((linked) =>
              expect(fs.existsSync(asSourcePath({ linked }))).toBe(true),
            );
          });
        },
      );

      then('the wisher-how blocks match across light and heavy', () => {
        const readTemplate = (input: { name: string }): string =>
          fs.readFileSync(
            path.join(__dirname, 'templates', input.name),
            'utf-8',
          );

        // the peer lanes and the vision self-review are one text per variant pair
        [
          { stem: '1.vision.guard', slug: 'wisher-how' },
          { stem: '1.vision.guard', slug: 'has-restated-the-wisher-how' },
          { stem: '3.3.1.blueprint.product.guard', slug: 'wisher-how' },
        ].forEach(({ stem, slug }) => {
          const light = getBlockOfSlug({
            template: readTemplate({ name: `${stem}.light` }),
            name: `${stem}.light`,
            slug,
          });
          const heavy = getBlockOfSlug({
            template: readTemplate({ name: `${stem}.heavy` }),
            name: `${stem}.heavy`,
            slug,
          });
          expect(light).toContain(slug);
          expect(heavy).toEqual(light);

          // the text the lane or reviewer reads, whole, for review: its run, flags, budget
          expect({ stem, slug, block: light }).toMatchSnapshot();
        });

        // each self-review carries the strike test, the constraint check, and the inverse check
        [
          '1.vision.guard.light',
          '1.vision.guard.heavy',
          '2.1.criteria.blackbox.guard.heavy',
        ].forEach((name) => {
          const block = getBlockOfSlug({
            template: readTemplate({ name }),
            name,
            slug: 'has-restated-the-wisher-how',
          });
          expect(block).toContain('strike the prior tool or poc from the repo');
          expect(block).toContain(
            'does a how the wisher tied to a domain why survive, stated with that why?',
          );
          expect(block).toContain('then check the inverse');
          expect(block).toContain("`## .the wisher's how`");
          expect(block).toContain('keep, drop, or open');

          // the text the writer reads, whole, for review
          expect({ name, block }).toMatchSnapshot();
        });
      });

      then('criteria has no guard in light mode', () => {
        // criteria guard not created in light mode
        expect(scene.result.created).not.toContain(
          '2.1.criteria.blackbox.guard',
        );
        expect(
          fs.existsSync(
            path.join(scene.behaviorDir, '2.1.criteria.blackbox.guard'),
          ),
        ).toBe(false);
      });

      then('vision guard has light self-reviews (7 reviews)', () => {
        const visionGuard = fs.readFileSync(
          path.join(scene.behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // light has 7 self-reviews: grounded-in-reality, experience-coverage, rendered-stdout,
        // restated-the-wisher-how, requirements, assumptions, questions
        expect(visionGuard).toContain('has-rendered-stdout');
        expect(visionGuard).toContain('has-grounded-in-reality');
        expect(visionGuard).toContain('has-experience-coverage');
        expect(visionGuard).toContain('has-restated-the-wisher-how');
        expect(visionGuard).toContain('slug: wisher-how');
        expect(visionGuard).toContain('has-questioned-requirements');
        expect(visionGuard).toContain('has-questioned-assumptions');
        expect(visionGuard).toContain('has-questioned-questions');

        // light also carries the experience-coverage peer review + a reviewed? judge,
        // wired against the widened glob that self-anchors on the vision yield — a
        // zero-case-file vision must still match at least that one file, never zero
        expect(visionGuard).toContain('slug: experience-coverage');
        expect(visionGuard).toContain("--paths-with '$route/1.vision.*.md'");
        expect(visionGuard).not.toContain(
          "--paths-with '$route/1.vision.experience.case=*.md'",
        );
        expect(visionGuard).toContain('reviewed?');

        // light does NOT have: fundamentals, inverse, devils-advocate, premortem, 5whys
        expect(visionGuard).not.toContain('has-questioned-fundamentals');
        expect(visionGuard).not.toContain('has-questioned-inverse');
        expect(visionGuard).not.toContain('has-questioned-devils-advocate');
        expect(visionGuard).not.toContain('has-questioned-premortem');
        expect(visionGuard).not.toContain('has-questioned-5whys');
      });
    });

    when('[t1] initBehaviorDir is called with guard=light explicitly', () => {
      then('creates light guard files', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'light',
        });

        expect(result.created).toContain('1.vision.guard');

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // light version characteristics
        expect(visionGuard).toContain('has-questioned-requirements');
        expect(visionGuard).not.toContain('has-questioned-fundamentals');
      });
    });
  });

  given('[case2] guard level is heavy', () => {
    when('[t0] initBehaviorDir is called with guard=heavy', () => {
      then('creates heavy guard files for all stages', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        // verify guard files created (without .heavy suffix)
        expect(result.created).toContain('1.vision.guard');
        expect(result.created).toContain('2.1.criteria.blackbox.guard');
        expect(result.created).toContain('3.3.1.blueprint.product.guard');

        // verify no .light or .heavy suffix files created
        expect(result.created).not.toContain('1.vision.guard.light');
        expect(result.created).not.toContain('1.vision.guard.heavy');
      });

      then('vision guard has heavy self-reviews (12 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const visionGuard = fs.readFileSync(
          path.join(behaviorDir, '1.vision.guard'),
          'utf-8',
        );

        // heavy has all 12 self-reviews, research-based ones too
        expect(visionGuard).toContain('has-rendered-stdout');
        expect(visionGuard).toContain('has-grounded-in-reality');
        expect(visionGuard).toContain('has-experience-coverage');
        expect(visionGuard).toContain('has-questioned-fundamentals');
        expect(visionGuard).toContain('has-questioned-requirements');
        expect(visionGuard).toContain('has-questioned-assumptions');
        expect(visionGuard).toContain('has-questioned-inverse');
        expect(visionGuard).toContain('has-questioned-devils-advocate');
        expect(visionGuard).toContain('has-questioned-premortem');
        expect(visionGuard).toContain('has-questioned-5whys');
        expect(visionGuard).toContain('has-questioned-questions');
        expect(visionGuard).toContain('has-restated-the-wisher-how');
        expect(visionGuard).toContain('slug: wisher-how');

        // heavy also carries the experience-coverage peer review + a reviewed? judge,
        // wired against the same widened glob as light (guard-variant-consistency)
        expect(visionGuard).toContain('slug: experience-coverage');
        expect(visionGuard).toContain("--paths-with '$route/1.vision.*.md'");
        expect(visionGuard).not.toContain(
          "--paths-with '$route/1.vision.experience.case=*.md'",
        );
        expect(visionGuard).toContain('reviewed?');
      });

      then('criteria guard has heavy self-reviews (5 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const criteriaGuard = fs.readFileSync(
          path.join(behaviorDir, '2.1.criteria.blackbox.guard'),
          'utf-8',
        );

        // heavy criteria has self-reviews
        expect(criteriaGuard).toContain('reviews:');
        expect(criteriaGuard).toContain('self:');
        expect(criteriaGuard).toContain('has-questioned-requirements');
        expect(criteriaGuard).toContain('has-questioned-devils-advocate');
        expect(criteriaGuard).toContain('has-questioned-counterexamples');
        expect(criteriaGuard).toContain('has-questioned-5whys');
        expect(criteriaGuard).toContain('has-restated-the-wisher-how');
      });

      then('blueprint guard has heavy self-reviews (11 reviews)', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          guard: 'heavy',
        });

        const blueprintGuard = fs.readFileSync(
          path.join(behaviorDir, '3.3.1.blueprint.product.guard'),
          'utf-8',
        );

        // heavy blueprint has research-based reviews
        expect(blueprintGuard).toContain('has-questioned-deletables');
        expect(blueprintGuard).toContain('has-questioned-assumptions');
        expect(blueprintGuard).toContain('has-questioned-5whys');
        expect(blueprintGuard).toContain('has-questioned-premortem');
        expect(blueprintGuard).toContain('has-questioned-inverse');
        expect(blueprintGuard).toContain('has-questioned-devils-advocate');

        // plus coverage/adherance checks
        expect(blueprintGuard).toContain('has-behavior-declaration-coverage');
        expect(blueprintGuard).toContain('has-behavior-declaration-adherance');
        expect(blueprintGuard).toContain('has-role-standards-adherance');
        expect(blueprintGuard).toContain('has-role-standards-coverage');

        // plus the wisher-how peer lane, which also grades the criteria yield
        expect(blueprintGuard).toContain('slug: wisher-how');
        expect(blueprintGuard).toContain("--paths-with '$route/2.*.yield.md'");
      });
    });
  });

  given('[case3] verification and playtest templates', () => {
    when('[t0] initBehaviorDir is called', () => {
      then('creates 5.3.verification.stone', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.3.verification.stone');
        expect(
          fs.existsSync(path.join(behaviorDir, '5.3.verification.stone')),
        ).toBe(true);

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.stone'),
          'utf-8',
        );
        expect(content).toContain('.what');
        expect(content).toContain('.why');
        expect(content).toContain('.how');
      });

      then('creates 5.3.verification.guard with self-reviews', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.3.verification.guard');

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.guard'),
          'utf-8',
        );
        expect(content).toContain('has-behavior-coverage');
        expect(content).toContain('has-zero-test-skips');
        expect(content).toContain('has-all-tests-passed');
        // has peer reviews and judges for strict verification
        expect(content).toContain('peer:');
        expect(content).toContain('judges:');
      });

      then('creates 5.5.playtest.stone', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.5.playtest.stone');
        expect(
          fs.existsSync(path.join(behaviorDir, '5.5.playtest.stone')),
        ).toBe(true);

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.5.playtest.stone'),
          'utf-8',
        );
        expect(content).toContain('.what');
        expect(content).toContain('.why');
        expect(content).toContain('.how');
      });

      then('creates 5.5.playtest.guard with self-reviews and judge', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.5.playtest.guard');

        const content = fs.readFileSync(
          path.join(behaviorDir, '5.5.playtest.guard'),
          'utf-8',
        );
        expect(content).toContain('has-clear-instructions');
        expect(content).toContain('has-vision-coverage');
        expect(content).toContain('has-edgecase-coverage');
        // playtest guard has approved? judge
        expect(content).toContain('judges:');
        expect(content).toContain('approved?');
      });
    });
  });

  given('[case4] guard level change after init', () => {
    when(
      '[t0] behavior already has light guards, called again with heavy',
      () => {
        then('keeps the extant light guards (findsert semantics)', () => {
          // first init with light
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
            guard: 'light',
          });

          // second init with heavy
          const result = initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
            guard: 'heavy',
          });

          // guards should be kept, not recreated
          expect(result.kept).toContain('1.vision.guard');
          expect(result.created).not.toContain('1.vision.guard');

          // content should still be light version
          const visionGuard = fs.readFileSync(
            path.join(behaviorDir, '1.vision.guard'),
            'utf-8',
          );
          expect(visionGuard).not.toContain('has-questioned-fundamentals');
        });
      },
    );
  });

  given('[case5] repros stone and guard', () => {
    when('[t0] initBehaviorDir is called', () => {
      then('creates repros guard with 3 self-reviews', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain(
          '3.2.distill.repros.experience._.guard',
        );

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.guard'),
          'utf-8',
        );

        expect(guardContent).toContain('has-critical-paths-identified');
        expect(guardContent).toContain('has-ergonomics-reviewed');
        expect(guardContent).toContain('has-play-test-convention');
      });

      then('repros stone includes journey sketch guidance', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('journey test sketches');
        expect(stoneContent).toContain('given/when/then');
        expect(stoneContent).toContain('[tN]');
      });

      then('repros stone includes input/output pairs guidance', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('input/output pairs');
        expect(stoneContent).toContain('snapshot target');
      });

      then('repros stone includes critical paths section', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('## critical paths');
        expect(stoneContent).toContain('happy paths');
      });

      then('repros stone includes ergonomics section', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '3.2.distill.repros.experience._.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('## ergonomics review');
        expect(stoneContent).toContain('feel natural');
      });
    });
  });

  given('[case6] verification stone and guard enhancements', () => {
    when('[t0] initBehaviorDir is called', () => {
      then('verification stone references repros artifact', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('3.2.distill.repros.experience');
        expect(stoneContent).toContain('repros artifact');
      });

      then('verification stone has enhanced behavior coverage table', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('snapshots?');
        expect(stoneContent).toContain('critical path?');
        expect(stoneContent).toContain('ergonomics ok?');
      });

      then('verification guard has 8 total self-reviews', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '5.3.verification.guard'),
          'utf-8',
        );

        // the 8 self-reviews retained after the low-yield cut (corpus-graded):
        // has-journey-tests-from-repros, has-contract-output-variants-snapped, and
        // has-play-test-convention were cut (0-4% gain + peer coverage)
        expect(guardContent).toContain('has-behavior-coverage');
        expect(guardContent).toContain('has-zero-test-skips');
        expect(guardContent).toContain('has-all-tests-passed');
        expect(guardContent).toContain('has-preserved-test-intentions');
        expect(guardContent).toContain('has-snap-changes-rationalized');
        expect(guardContent).toContain('has-critical-paths-frictionless');
        expect(guardContent).toContain('has-ergonomics-validated');
        expect(guardContent).toContain('has-fixed-all-gaps');

        // the cut slugs must NOT reappear
        expect(guardContent).not.toContain('has-journey-tests-from-repros');
        expect(guardContent).not.toContain(
          'has-contract-output-variants-snapped',
        );
        expect(guardContent).not.toContain('has-play-test-convention');
      });
    });
  });

  given('[case7] evaluation stone and guard', () => {
    when('[t0] initBehaviorDir is called', () => {
      then('creates 5.2.evaluation.stone', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.2.evaluation.stone');
        expect(
          fs.existsSync(path.join(behaviorDir, '5.2.evaluation.stone')),
        ).toBe(true);
      });

      then('evaluation stone mirrors blueprint structure', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.stone'),
          'utf-8',
        );

        // mirrors blueprint sections
        expect(stoneContent).toContain('## summary (as implemented)');
        expect(stoneContent).toContain('## filediff tree (as implemented)');
        expect(stoneContent).toContain('## codepath tree (as implemented)');
        expect(stoneContent).toContain('## test coverage (as implemented)');
      });

      then('evaluation stone includes divergence analysis', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('## divergence analysis');
        expect(stoneContent).toContain('### divergences found');
        expect(stoneContent).toContain('### divergence resolution');
        expect(stoneContent).toContain('repair');
        expect(stoneContent).toContain('blocker');
      });

      then('evaluation stone references blueprint artifact', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const stoneContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.stone'),
          'utf-8',
        );

        expect(stoneContent).toContain('3.3.1.blueprint.product');
        expect(stoneContent).toContain('.behavior/v2025_01_01.test-feature');
      });

      then('creates 5.2.evaluation.guard with 4 self-reviews', () => {
        const result = initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        expect(result.created).toContain('5.2.evaluation.guard');

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.guard'),
          'utf-8',
        );

        expect(guardContent).toContain('has-complete-implementation-record');
        expect(guardContent).toContain('has-divergence-analysis');
        expect(guardContent).toContain('has-divergence-addressed');
        expect(guardContent).toContain('has-no-silent-scope-creep');
      });

      then('evaluation guard checks divergences skeptically', () => {
        initBehaviorDir({
          behaviorDir,
          behaviorDirRel: '.behavior/v2025_01_01.test-feature',
        });

        const guardContent = fs.readFileSync(
          path.join(behaviorDir, '5.2.evaluation.guard'),
          'utf-8',
        );

        // skeptical checks of backups
        expect(guardContent).toContain('skeptical');
        expect(guardContent).toContain('laziness');
        expect(guardContent).toContain('rationale');
      });
    });

    given('[case5] guards carry self-referential provenance', () => {
      const templatesUriBase =
        'node_modules/rhachet-roles-bhuild/dist/domain.operations/behavior/init/templates';

      when('[t0] inited with guard=heavy', () => {
        then('variant guard uri points at its .heavy source template', () => {
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
            guard: 'heavy',
          });

          // the route guard drops the .heavy suffix, but its provenance uri
          // must point back at the .heavy source so upgrade re-reads the same file
          const visionGuard = fs.readFileSync(
            path.join(behaviorDir, '1.vision.guard'),
            'utf-8',
          );
          expect(visionGuard).toContain('provenance:');
          expect(visionGuard).toContain(
            `uri: ${templatesUriBase}/1.vision.guard.heavy`,
          );
        });
      });

      when('[t1] inited with guard=light (default)', () => {
        then('variant guard uri points at its .light source template', () => {
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          });

          const blueprintGuard = fs.readFileSync(
            path.join(behaviorDir, '3.3.1.blueprint.product.guard'),
            'utf-8',
          );
          expect(blueprintGuard).toContain('provenance:');
          expect(blueprintGuard).toContain(
            `uri: ${templatesUriBase}/3.3.1.blueprint.product.guard.light`,
          );
        });

        then('non-variant guard uri points at its own source template', () => {
          initBehaviorDir({
            behaviorDir,
            behaviorDirRel: '.behavior/v2025_01_01.test-feature',
          });

          const evaluationGuard = fs.readFileSync(
            path.join(behaviorDir, '5.2.evaluation.guard'),
            'utf-8',
          );
          expect(evaluationGuard).toContain('provenance:');
          expect(evaluationGuard).toContain(
            `uri: ${templatesUriBase}/5.2.evaluation.guard`,
          );
        });
      });

      when('[t2] every guard template is read from source', () => {
        then('each guard template uri points at its own file', () => {
          // exhaustive, not sampled: a hand-typed uri on a new guard must not drift
          const templatesDir = path.join(__dirname, 'templates');
          const guardTemplateNames = fs
            .readdirSync(templatesDir)
            .filter((name) => /\.guard(\.(light|heavy))?$/.test(name));
          expect(guardTemplateNames.length).toBeGreaterThan(0);
          const uriMismatches = guardTemplateNames.filter(
            (name) =>
              !fs
                .readFileSync(path.join(templatesDir, name), 'utf-8')
                .includes(`uri: ${templatesUriBase}/${name}\n`),
          );
          expect(uriMismatches).toEqual([]);
        });
      });
    });
  });
});

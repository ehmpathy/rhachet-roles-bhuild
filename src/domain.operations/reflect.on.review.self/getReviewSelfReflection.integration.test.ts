import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { ReflectOnReviewSelfVerdict } from '@src/domain.objects/reflect.on.review.self/ReflectOnReviewSelfVerdict';

import {
  getReviewSelfReflection,
  type ReviewSelfJudge,
} from './getReviewSelfReflection';

/**
 * .what = one transcript event as a jsonl line
 * .why = the corpus is a stream of these; tests synthesize them directly
 */
const asEventLine = (input: {
  toolUses?: { name: string; input: Record<string, unknown> }[];
  text?: string;
}): string =>
  JSON.stringify({
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        ...(input.text ? [{ type: 'text', text: input.text }] : []),
        ...(input.toolUses ?? []).map((toolUse) => ({
          type: 'tool_use',
          name: toolUse.name,
          input: toolUse.input,
        })),
      ],
    },
    cwd: '/x',
    gitBranch: 'main',
    sessionId: 's',
    timestamp: '2026-07-09T00:00:00Z',
  });

/**
 * .what = a bash tool_use that runs a route.stone.set boundary command
 */
const asBoundaryLine = (input: { command: string }): string =>
  asEventLine({
    toolUses: [{ name: 'Bash', input: { command: input.command } }],
  });

const ROUTE = '.behavior/test-route';

/**
 * .what = a synthetic transcript with two chained review windows
 * .why = review 1 (has-questioned-assumptions) does a real edit + read;
 *        review 2 (has-questioned-questions) does no work between promises
 */
const TRANSCRIPT = [
  // trigger review 1
  asBoundaryLine({
    command: `rhx route.stone.set --as passed --stone 1.vision --route ${ROUTE}`,
  }),
  // review 1 work: an edit + a read of the route artifact
  asEventLine({ text: 'i found a real gap in the vision', toolUses: [] }),
  asEventLine({ toolUses: [{ name: 'Edit', input: {} }] }),
  asEventLine({
    toolUses: [{ name: 'Read', input: { file_path: `${ROUTE}/1.vision.md` } }],
  }),
  // promise review 1 (closes 1, triggers 2)
  asBoundaryLine({
    command: `rhx route.stone.set --as promised --stone 1.vision --route ${ROUTE} --that has-questioned-assumptions`,
  }),
  // corrupt line in the middle — must be tolerated
  '{ this is not valid json',
  // review 2 does no work between the two promises
  // promise review 2
  asBoundaryLine({
    command: `rhx route.stone.set --as promised --stone 1.vision --route ${ROUTE} --that has-questioned-questions`,
  }),
].join('\n');

/**
 * .what = scaffold a temp corpus with one transcript
 */
const genTempCorpusWithTranscript = (input: { content: string }): string => {
  const root = mkdtempSync(join(tmpdir(), 'reflect-sweep-'));
  const projectDir = join(root, 'proj-test');
  mkdirSync(projectDir, { recursive: true });
  writeFileSync(join(projectDir, 'session.jsonl'), input.content);
  return root;
};

/**
 * .what = scaffold a temp corpus with one transcript per named project
 * .why = the core deliverable is cross-instance aggregation — the per-slug stats
 *        must SUM windows found across many projects/transcripts into one rollup
 */
const genTempCorpusWithProjects = (input: {
  projects: { slug: string; content: string }[];
}): string => {
  const root = mkdtempSync(join(tmpdir(), 'reflect-multi-'));
  for (const project of input.projects) {
    const projectDir = join(root, project.slug);
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(join(projectDir, 'session.jsonl'), project.content);
  }
  return root;
};

/**
 * .what = a minimal transcript with one promised review for the given slug + route
 * .why = a per-project block for the cross-instance aggregation test
 */
const asOneReviewTranscript = (input: {
  slug: string;
  route: string;
  withEdit: boolean;
}): string =>
  [
    asBoundaryLine({
      command: `rhx route.stone.set --as passed --stone 1.vision --route ${input.route}`,
    }),
    ...(input.withEdit
      ? [asEventLine({ toolUses: [{ name: 'Edit', input: {} }] })]
      : []),
    asBoundaryLine({
      command: `rhx route.stone.set --as promised --stone 1.vision --route ${input.route} --that ${input.slug}`,
    }),
  ].join('\n');

describe('getReviewSelfReflection (integration)', () => {
  given('[case1] a corpus with one transcript of two chained windows', () => {
    const scene = useBeforeAll(async () => {
      const root = genTempCorpusWithTranscript({ content: TRANSCRIPT });
      return { root };
    });
    afterAll(() => rmSync(scene.root, { recursive: true, force: true }));

    when('[t0] swept in plan mode (no judge)', () => {
      const result = useBeforeAll(async () =>
        getReviewSelfReflection(
          {
            projectFilter: null,
            routeFilter: null,
            stoneFilter: null,
            judge: null,
          },
          { projectsDir: scene.root },
        ),
      );

      then('it reconstructs both chained windows', () => {
        expect(result.windows).toHaveLength(2);
        const slugs = result.windows.map((w) => w.slug).sort();
        expect(slugs).toEqual([
          'has-questioned-assumptions',
          'has-questioned-questions',
        ]);
      });

      then('it attributes the edit + read to the first review only', () => {
        const withEdit = result.windows.find(
          (w) => w.slug === 'has-questioned-assumptions',
        )!;
        const noEdit = result.windows.find(
          (w) => w.slug === 'has-questioned-questions',
        )!;
        expect(withEdit.signals.editCount).toEqual(1);
        expect(withEdit.signals.readReviewedArtifact).toEqual(true);
        expect(noEdit.signals.editCount).toEqual(0);
        expect(noEdit.signals.readReviewedArtifact).toEqual(false);
      });

      then('it tolerates the corrupt line and reads the transcript', () => {
        expect(result.aggregate.transcriptsRead).toEqual(1);
        expect(result.aggregate.transcriptsSkipped).toEqual(0);
      });

      then('windows carry no verdict in plan mode', () => {
        expect(result.windows.every((w) => w.verdict === null)).toEqual(true);
      });
    });

    when('[t1] swept in apply mode with a fake judge', () => {
      const judge: ReviewSelfJudge = async ({ window }) =>
        new ReflectOnReviewSelfVerdict({
          label: window.signals.editCount > 0 ? 'genuine-gain' : 'feigned-noop',
          reason: 'fake judge based on edit count',
        });

      const result = useBeforeAll(async () =>
        getReviewSelfReflection(
          {
            projectFilter: null,
            routeFilter: null,
            stoneFilter: null,
            judge,
          },
          { projectsDir: scene.root },
        ),
      );

      then('it attaches a verdict to every window', () => {
        expect(result.windows.every((w) => w.verdict !== null)).toEqual(true);
      });

      then('the aggregate tallies the verdicts per slug', () => {
        const gain = result.aggregate.slugs.find(
          (s) => s.slug === 'has-questioned-assumptions',
        )!;
        const feigned = result.aggregate.slugs.find(
          (s) => s.slug === 'has-questioned-questions',
        )!;
        expect(gain.verdicts.genuineGain).toEqual(1);
        expect(feigned.verdicts.feignedNoop).toEqual(1);
      });
    });

    when('[t2] swept with a stone filter that matches no window', () => {
      const result = useBeforeAll(async () =>
        getReviewSelfReflection(
          {
            projectFilter: null,
            routeFilter: null,
            stoneFilter: '9.nonexistent',
            judge: null,
          },
          { projectsDir: scene.root },
        ),
      );

      then('it yields an empty window list', () => {
        expect(result.windows).toEqual([]);
      });
    });
  });

  given(
    '[case2] a corpus of three projects that each ran the same slug',
    () => {
      // two projects edited during the review, one did not — the per-slug
      // aggregate must SUM all three firings across the separate transcripts
      const scene = useBeforeAll(async () => {
        const root = genTempCorpusWithProjects({
          projects: [
            {
              slug: 'proj-a',
              content: asOneReviewTranscript({
                slug: 'has-questioned-assumptions',
                route: '.behavior/route-a',
                withEdit: true,
              }),
            },
            {
              slug: 'proj-b',
              content: asOneReviewTranscript({
                slug: 'has-questioned-assumptions',
                route: '.behavior/route-b',
                withEdit: true,
              }),
            },
            {
              slug: 'proj-c',
              content: asOneReviewTranscript({
                slug: 'has-questioned-assumptions',
                route: '.behavior/route-c',
                withEdit: false,
              }),
            },
          ],
        });
        return { root };
      });
      afterAll(() => rmSync(scene.root, { recursive: true, force: true }));

      when('[t0] swept machine-wide in plan mode', () => {
        const result = useBeforeAll(async () =>
          getReviewSelfReflection(
            {
              projectFilter: null,
              routeFilter: null,
              stoneFilter: null,
              judge: null,
            },
            { projectsDir: scene.root },
          ),
        );

        then('it unions windows across all three project transcripts', () => {
          expect(result.windows).toHaveLength(3);
          expect(result.aggregate.transcriptsRead).toEqual(3);
        });

        then('it counts each project as a distinct route run', () => {
          expect(result.aggregate.routesFound).toEqual(3);
        });

        then('it counts the three distinct projects swept', () => {
          expect(result.aggregate.projectsSwept).toEqual(3);
        });

        then('the per-slug aggregate sums firings across the corpus', () => {
          const stat = result.aggregate.slugs.find(
            (s) => s.slug === 'has-questioned-assumptions',
          )!;
          expect(stat.firings).toEqual(3);
          expect(stat.firingsWithEdit).toEqual(2);
        });
      });

      when('[t1] narrowed to one project via the project filter', () => {
        const result = useBeforeAll(async () =>
          getReviewSelfReflection(
            {
              projectFilter: 'proj-a',
              routeFilter: null,
              stoneFilter: null,
              judge: null,
            },
            { projectsDir: scene.root },
          ),
        );

        then('only that project’s single window is reflected', () => {
          expect(result.windows).toHaveLength(1);
          expect(result.windows[0]!.transcriptPath).toContain('proj-a');
        });

        then('the filter narrows the projects-swept count to one', () => {
          expect(result.aggregate.projectsSwept).toEqual(1);
        });
      });
    },
  );

  given('[case3] two routes whose names share a version prefix', () => {
    // `.behavior/v1` is a strict prefix of `.behavior/v10-other`; a bare
    // containment filter would wrongly capture both — the anchored match must not
    const scene = useBeforeAll(async () => {
      const root = genTempCorpusWithProjects({
        projects: [
          {
            slug: 'proj-v1',
            content: asOneReviewTranscript({
              slug: 'has-questioned-assumptions',
              route: '.behavior/v1',
              withEdit: true,
            }),
          },
          {
            slug: 'proj-v10',
            content: asOneReviewTranscript({
              slug: 'has-questioned-assumptions',
              route: '.behavior/v10-other',
              withEdit: true,
            }),
          },
        ],
      });
      return { root };
    });
    afterAll(() => rmSync(scene.root, { recursive: true, force: true }));

    when('[t0] filtered to the shorter route .behavior/v1', () => {
      const result = useBeforeAll(async () =>
        getReviewSelfReflection(
          {
            projectFilter: null,
            routeFilter: '.behavior/v1',
            stoneFilter: null,
            judge: null,
          },
          { projectsDir: scene.root },
        ),
      );

      then('it matches the exact route only, not the v10 prefix peer', () => {
        expect(result.windows).toHaveLength(1);
        expect(result.windows[0]!.route).toEqual('.behavior/v1');
      });
    });
  });

  given(
    '[case4] a corpus with one readable and one unreadable transcript',
    () => {
      const scene = useBeforeAll(async () => {
        const root = mkdtempSync(join(tmpdir(), 'reflect-skip-'));
        const projectDir = join(root, 'proj-test');
        mkdirSync(projectDir, { recursive: true });
        // a readable transcript with one promised review
        writeFileSync(
          join(projectDir, 'good.jsonl'),
          asOneReviewTranscript({
            slug: 'has-questioned-assumptions',
            route: ROUTE,
            withEdit: true,
          }),
        );
        // an UNREADABLE "transcript": a directory whose name ends in .jsonl, so
        // readFileSync raises EISDIR — the tolerated fs-errno skip branch the
        // vision requires ("skip it, tally it, never fatal to the sweep")
        mkdirSync(join(projectDir, 'broken.jsonl'), { recursive: true });
        return { root };
      });
      afterAll(() => rmSync(scene.root, { recursive: true, force: true }));

      when('[t0] swept machine-wide', () => {
        const result = useBeforeAll(async () =>
          getReviewSelfReflection(
            {
              projectFilter: null,
              routeFilter: null,
              stoneFilter: null,
              judge: null,
            },
            { projectsDir: scene.root },
          ),
        );

        then('it skips the unreadable transcript and tallies it', () => {
          expect(result.aggregate.transcriptsSkipped).toEqual(1);
        });

        then(
          'the skip is never fatal — the good transcript still reflects',
          () => {
            expect(result.aggregate.transcriptsRead).toEqual(1);
            expect(result.windows).toHaveLength(1);
          },
        );
      });
    },
  );

  given('[case5] a corpus with windows across two stones', () => {
    // the stone filter's positive-match branch: the route filter (case3) and the
    // project filter (case2 t1) each get a dedicated narrows-correctly test, but
    // the stone filter's only prior test is a miss-case (case1 t2). this closes
    // that asymmetry — a corpus with one 1.vision window and one 2.1.criteria
    // window, narrowed to a single stone, must yield only that stone's window
    const TWO_STONE_TRANSCRIPT = [
      asBoundaryLine({
        command: `rhx route.stone.set --as passed --stone 1.vision --route ${ROUTE}`,
      }),
      asEventLine({ toolUses: [{ name: 'Edit', input: {} }] }),
      asBoundaryLine({
        command: `rhx route.stone.set --as promised --stone 1.vision --route ${ROUTE} --that has-questioned-assumptions`,
      }),
      asBoundaryLine({
        command: `rhx route.stone.set --as passed --stone 2.1.criteria --route ${ROUTE}`,
      }),
      asEventLine({ toolUses: [{ name: 'Edit', input: {} }] }),
      asBoundaryLine({
        command: `rhx route.stone.set --as promised --stone 2.1.criteria --route ${ROUTE} --that has-questioned-assumptions`,
      }),
    ].join('\n');

    const scene = useBeforeAll(async () => {
      const root = genTempCorpusWithTranscript({
        content: TWO_STONE_TRANSCRIPT,
      });
      return { root };
    });
    afterAll(() => rmSync(scene.root, { recursive: true, force: true }));

    when('[t0] swept with no stone filter', () => {
      const result = useBeforeAll(async () =>
        getReviewSelfReflection(
          {
            projectFilter: null,
            routeFilter: null,
            stoneFilter: null,
            judge: null,
          },
          { projectsDir: scene.root },
        ),
      );

      then('it reconstructs a window for each of the two stones', () => {
        expect(result.windows).toHaveLength(2);
        const stones = result.windows.map((w) => w.stone).sort();
        expect(stones).toEqual(['1.vision', '2.1.criteria']);
      });
    });

    when('[t1] narrowed to the 2.1.criteria stone', () => {
      const result = useBeforeAll(async () =>
        getReviewSelfReflection(
          {
            projectFilter: null,
            routeFilter: null,
            stoneFilter: '2.1.criteria',
            judge: null,
          },
          { projectsDir: scene.root },
        ),
      );

      then('only the requested stone’s window is reflected', () => {
        expect(result.windows).toHaveLength(1);
        expect(result.windows[0]!.stone).toEqual('2.1.criteria');
      });
    });
  });
});

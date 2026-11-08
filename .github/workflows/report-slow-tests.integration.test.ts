import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

/**
 * .what = run this repo's real slow-test reporter on a jest --json report written to a temp dir
 * .why = the reporter gates every ci shard; its exit code is the contract a shard meets
 */
const runReporterOn = (input: {
  slug: string;
  report: unknown;
}): { status: number | null; stdout: string; summary: string } => {
  const cwd = genTempDir({ slug: input.slug });
  const fileReport = path.join(cwd, 'jest-results.json');
  const fileSummary = path.join(cwd, 'summary.md');
  fs.writeFileSync(fileReport, JSON.stringify(input.report));
  fs.writeFileSync(fileSummary, '');
  const run = spawnSync(
    'bash',
    [path.join(__dirname, 'report-slow-tests.sh'), fileReport],
    { cwd, env: { ...process.env, GITHUB_STEP_SUMMARY: fileSummary } },
  );
  return {
    status: run.status,
    stdout: run.stdout.toString('utf-8'),
    summary: fs.readFileSync(fileSummary, 'utf-8'),
  };
};

/**
 * .what = one jest --json file entry, with its span and the status of each of its tests
 */
const asFileEntry = (input: {
  name: string;
  startTime: number;
  endTime: number;
  statuses: string[];
}) => ({
  name: input.name,
  startTime: input.startTime,
  endTime: input.endTime,
  assertionResults: input.statuses.map((status) => ({ status })),
});

describe('report-slow-tests', () => {
  given('[case1] a shard whose one file is fully skipped', () => {
    when('[t0] the reporter runs', () => {
      const result = useThen('it runs', () =>
        runReporterOn({
          slug: 'slow-tests-skipped-shard',
          report: {
            testResults: [
              asFileEntry({
                name: 'blackbox/skill.review.deliverable.acceptance.test.ts',
                startTime: 0,
                endTime: 0,
                statuses: ['pending', 'pending', 'todo'],
              }),
            ],
          },
        }),
      );

      then('it exits 0', () => {
        expect(result.status).toEqual(0);
      });

      then('it states the shard was skipped, in the summary', () => {
        expect(result.summary).toContain('no test ran (skipped shard)');
      });

      then('it raises no schema-drift error', () => {
        expect(result.stdout).not.toContain('::error::');
      });
    });
  });

  given('[case2] a shard where tests ran, yet every span reads zero', () => {
    when('[t0] the reporter runs', () => {
      const result = useThen('it runs', () =>
        runReporterOn({
          slug: 'slow-tests-drift-shard',
          report: {
            testResults: [
              asFileEntry({
                name: 'src/a.integration.test.ts',
                startTime: 0,
                endTime: 0,
                statuses: ['passed', 'pending'],
              }),
            ],
          },
        }),
      );

      then('it exits 1, so a schema drift still fails loud', () => {
        expect(result.status).toEqual(1);
      });

      then('it names the drift', () => {
        expect(result.stdout).toContain(
          '::error::slow-test report parsed 0 durations from 1 test files',
        );
      });
    });
  });

  given('[case3] a shard with zero test files', () => {
    when('[t0] the reporter runs', () => {
      const result = useThen('it runs', () =>
        runReporterOn({
          slug: 'slow-tests-empty-shard',
          report: { testResults: [] },
        }),
      );

      then('it exits 0 and states the empty shard', () => {
        expect(result.status).toEqual(0);
        expect(result.summary).toContain('(empty shard)');
      });
    });
  });

  given('[case4] a shard where tests ran with real spans', () => {
    when('[t0] the reporter runs', () => {
      const result = useThen('it runs', () =>
        runReporterOn({
          slug: 'slow-tests-healthy-shard',
          report: {
            testResults: [
              asFileEntry({
                name: 'src/slow.integration.test.ts',
                startTime: 1_000,
                endTime: 41_000,
                statuses: ['passed'],
              }),
              asFileEntry({
                name: 'src/fast.integration.test.ts',
                startTime: 1_000,
                endTime: 3_000,
                statuses: ['passed', 'failed'],
              }),
            ],
          },
        }),
      );

      then('it exits 0', () => {
        expect(result.status).toEqual(0);
      });

      then('it ranks the files slowest first in the summary', () => {
        expect(result.summary).toContain('| 40s | src/slow.integration.test.ts |');
        expect(result.summary.indexOf('slow.integration')).toBeLessThan(
          result.summary.indexOf('fast.integration'),
        );
      });

      then('it flags the 30s outlier at its file', () => {
        expect(result.stdout).toContain(
          '::warning file=src/slow.integration.test.ts::slow test: 40s',
        );
      });
    });
  });
});
